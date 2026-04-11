# Modelo de Datos Relacional - Motor Transaccional de Gallero

## 1. Propósito y Alcance
Una nota breve indicando que este schema cubre exclusivamente el motor de emparejamiento y el libro mayor (ledger). Las entidades de presentación (Eventos, Rondas, Configuración de UI) se definen por separado.

## 2. Reglas Fundamentales
Tres reglas no negociables:
* **(a)** Los montos financieros nunca se almacenan como FLOAT, siempre como Decimal o entero en centavos.
* **(b)** La tabla `ledger_entries` es append-only, jamás se hace UPDATE ni DELETE.
* **(c)** El spread de la casa no se reconoce como ingreso al momento del emparejamiento, sino exclusivamente cuando la pelea pasa a estado FINISHED.

## 3. ENUMs

**FightStatus**
* `OPEN`: Pelea abierta para recibir apuestas.
* `CLOSED`: Pelea cerrada, no se aceptan más apuestas.
* `RESOLVING`: El administrador dictó el resultado, esperando expiración para pagos.
* `FINISHED_RED`: Pelea finalizada, victoria para el bando rojo.
* `FINISHED_GREEN`: Pelea finalizada, victoria para el bando verde.
* `FINISHED_DRAW`: Pelea finalizada en empate.
* `CANCELED`: Pelea cancelada, se devuelven las apuestas.

**OrderStatus**
* `OPEN`: Orden abierta y buscando emparejamiento.
* `PARTIALLY_MATCHED`: Orden parcialmente emparejada.
* `MATCHED`: Orden completamente emparejada.
* `SETTLED`: Orden pagada/resuelta tras finalizar la pelea.
* `CANCELED`: Orden cancelada (por usuario o expiración).

**LedgerEntryType**
* `DEPOSIT_APPROVED`: Depósito de fondos aprobado.
* `WITHDRAWAL_REQUESTED`: Solicitud de retiro de fondos (congela saldo).
* `WITHDRAWAL_COMPLETED`: Retiro de fondos completado.
* `BET_STAKE_FROZEN`: Monto de apuesta congelado al crear la orden.
* `BET_STAKE_RELEASED`: Monto de apuesta liberado (por cancelación o empate).
* `WINNING_PAYOUT`: Pago de ganancias por apuesta acertada.
* `HOUSE_BROKERAGE_FEE`: Comisión de la casa cobrada.
* `HOUSE_SPREAD_PROFIT`: Ganancia de la casa por el spread (diferencia matemática).

**BetSide**
* `RED`: Apuesta a favor del bando rojo.
* `GREEN`: Apuesta a favor del bando verde.

## 4. Entidades

### `users`
* `id`: UUID (PK).
* `phone`: String. Teléfono del usuario.
* `full_name`: String. Nombre completo.
* `password_hash`: String. Hash de la contraseña.
* `created_at`: Timestamp. Fecha de creación.

### `wallets`
* `id`: UUID (PK).
* `user_id`: UUID (FK unique a `users`).
* `balance_available`: Decimal/Entero. Saldo disponible para apostar o retirar.
* `balance_frozen`: Decimal/Entero. Saldo bloqueado en apuestas abiertas o retiros en proceso.
* `updated_at`: Timestamp. Fecha de última actualización.

### `ledger_entries`
* `id`: UUID (PK).
* `wallet_id`: UUID (FK a `wallets`).
* `type`: `LedgerEntryType`. Tipo de movimiento en el libro mayor.
* `amount`: Decimal/Entero. Monto de la transacción (siempre positivo).
* `reference_type`: String polimórfico (ej. 'Order', 'Match', 'Withdrawal').
* `reference_id`: UUID. ID de la referencia polimórfica.
* `created_at`: Timestamp. Fecha de creación.

### `fights`
* `id`: UUID (PK).
* `red_party_name`: String. Nombre del bando rojo.
* `green_party_name`: String. Nombre del bando verde.
* `status`: `FightStatus` (default `OPEN`).
* `resolving_expires_at`: Timestamp nullable. Se llena cuando el admin dicta resultado; el Worker lo usa para disparar pagos al llegar a cero.
* `created_at`: Timestamp. Fecha de creación.

### `bet_orders`
* `id`: UUID (PK).
* `user_id`: UUID (FK a `users`).
* `fight_id`: UUID (FK a `fights`).
* `side`: `BetSide`. Bando al que se apuesta.
* `amount_staked`: Decimal/Entero. Monto bloqueado original.
* `target_win_amount`: Decimal/Entero. Ganancia buscada — igual a `amount_staked` en apuesta Pareja, menor en Dando, mayor en Agarrando.
* `unmatched_staked_amount`: Decimal/Entero. Contador que el Worker decrementa al crear matches; permite queries rápidos de liquidez disponible.
* `status`: `OrderStatus`.
* `expires_at`: Timestamp. TTL configurable para cancelación automática.
* `created_at`: Timestamp. Fecha de creación.

### `bet_matches`
* `id`: UUID (PK).
* `fight_id`: UUID (FK a `fights`).
* `total_red_staked`: Decimal/Entero. Total apostado por el bando rojo en este match.
* `total_green_staked`: Decimal/Entero. Total apostado por el bando verde en este match.
* `created_at`: Timestamp. Fecha de creación.
* **Nota**: Si `total_red_staked` ≠ `sum(target_win_contributed)` de las piernas verdes, el excedente matemático es el spread de la casa, que se transfiere a HOUSE_WALLET al resolver la pelea.

### `bet_match_legs`
* `id`: UUID (PK).
* `bet_match_id`: UUID (FK a `bet_matches`).
* `bet_order_id`: UUID (FK a `bet_orders`).
* `side`: `BetSide`. Desnormalizado para velocidad en queries de pago.
* `amount_staked_contributed`: Decimal/Entero. Fracción de la orden inyectada a este match.
* `target_win_contributed`: Decimal/Entero. Fracción de ganancia esperada para esta pierna.

## 5. Diagrama de relaciones
* Un `user` tiene un `wallet`.
* Un `wallet` tiene muchos `ledger_entries`.
* Una `fight` tiene muchas `bet_orders`.
* Una `fight` tiene muchos `bet_matches`.
* Un `bet_match` tiene muchas `bet_match_legs`.
* Una `bet_order` tiene muchas `bet_match_legs`.

## 6. Notas para el desarrollador
* **Cálculo del spread**: El spread se calcula al momento de la resolución. Es la diferencia matemática entre el total apostado por el bando perdedor y la suma de las ganancias esperadas (`target_win_contributed`) de las piernas ganadoras en un match.
* **Flujo del Worker**: El Worker monitorea la tabla `fights`. Cuando detecta una pelea en estado `RESOLVING` y su `resolving_expires_at` ha vencido, ejecuta los pagos correspondientes y cambia el estado a `FINISHED_RED`, `FINISHED_GREEN` o `FINISHED_DRAW`.
* **HOUSE_WALLET**: La cartera de la casa (`HOUSE_WALLET`) es una `wallet` con `user_id` nulo o perteneciente a un usuario especial con rol `HOUSE`.
