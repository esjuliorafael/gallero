---
name: verificar-req-6-5-tipos-apuestas-odds
version: 1
description: |
  Usar cuando se quiera verificar si el proyecto Gallero cumple con el requisito 6.5 del PRD:
  "Tipos de Apuestas y Gestión de Cuotas (Odds)". Actívate cuando el usuario pregunte sobre:
  - cumplimiento de requisito 6.5
  - tipos de apuestas (Pareja, Dando, Agarrando)
  - gestión de cuotas u odds
  - modal de apuesta con selección de tipo
  - lógica de spread o diferencial
  - verificar implementación de apuestas asimétricas
  - revisar si Gallero soporta Dando/Agarrando
agents: [computer]
---

# Skill: Verificar Requisito 6.5 — Tipos de Apuestas y Gestión de Cuotas (Odds)

## Objetivo

Esta skill audita el código del repositorio **Gallero** para determinar si la implementación actual cumple con el requisito **6.5 del PRD**: soporte de tres modalidades de apuesta por pelea (Pareja, Dando, Agarrando) con su lógica de resolución, spread y emparejamiento parcial asimétrico.

---

## Contexto del Requisito 6.5 (PRD)

La plataforma debe soportar **tres modalidades de apuesta** para una misma pelea:

### 1. Pareja (1:1) — Estándar
- El apostador fondea una cantidad y espera ganar exactamente la misma cantidad del oponente.
- Emparejamiento simétrico, sin cuotas.

### 2. Dando (Dar Cuota — Asumir Riesgo)
- El apostador ofrece un monto **mayor** para asegurar una ganancia **menor**.
- Ejemplo: "Dar 1,000 al 80" → bloquea 1,000 MXN pero su meta de ganancia es solo 800 MXN.
- Incentiva a oponentes a entrar rápido.
- Resolución si gana quien Dio: recupera sus 1,000 + gana los 800 del oponente (menos 10% corretaje sobre los 800).
- Resolución si pierde quien Dio: el oponente recupera sus 800 + se lleva los 1,000 (menos 10% corretaje sobre los 1,000).

### 3. Agarrando (Tomar Cuota — Menor Riesgo)
- Es la contraparte natural del que "Da".
- El apostador fondea **menos** capital para ganar una bolsa **mayor**.
- Ejemplo: "Agarrar 1,000 al 80" → bloquea solo 800 MXN, pero su meta de ganancia es 1,000 MXN.

### Escenario de Spread — Ganancia de la Casa
Cuando el que "Da" no encuentra un oponente directo que "Agarre", el motor de liquidez puede agrupar apostadores de "Pareja" para cubrir el lado contrario:
- El apostador Dando fonde 1,000; el motor agrupa apostadores Pareja que suman 800 al lado contrario.
- Si gana el que Dio: recupera 1,000 + gana los 800 agrupados (menos 10% corretaje).
- Si pierden los de Pareja: cada uno recupera su fondeo proporcional y gana del perdedor (menos 10% corretaje).
- **Los 200 MXN de diferencial (1,000 fondeado - 800 pagados) quedan para la casa**, además del 10% de corretaje.

---

## Pasos de Verificación

Cuando se active esta skill, ejecutar los siguientes pasos en orden:

### Paso 1 — Explorar la estructura del repositorio
```
Buscar en el repo esjuliorafael/gallero los directorios:
- app/ o apps/ → rutas de Next.js
- components/ → componentes de UI
- lib/ → lógica de negocio
- hooks/ → custom hooks
Identificar archivos relacionados con apuestas: bet, apuesta, wager, odds, match
```

### Paso 2 — Buscar el tipo/enum de modalidades de apuesta
Buscar en el código TypeScript/JavaScript la existencia de:
- [ ] Un tipo, enum o constante que defina las tres modalidades: `PAREJA`, `DANDO`, `AGARRANDO` (o equivalentes en inglés: `STANDARD`, `GIVING`, `TAKING`)
- [ ] Un campo `type` o `modalidad` en la estructura de datos de una apuesta (`Bet`, `Apuesta`, etc.)
- [ ] Valores como `"pareja"`, `"dando"`, `"agarrando"`, `"1:1"`, `"giving"`, `"taking"`

**Criterio de cumplimiento:** El sistema debe reconocer y diferenciar explícitamente las tres modalidades.

### Paso 3 — Verificar el modelo de datos (schema/base de datos)
Revisar `SCHEMA.md` y archivos de migración o esquemas (Prisma, Drizzle, SQL, etc.):
- [ ] La tabla de apuestas (`bets`, `apuestas`) tiene un campo para el tipo de modalidad
- [ ] Existe un campo para el monto fondeado (`amount`, `monto`)
- [ ] Existe un campo para la meta de ganancia / cuota (`target_amount`, `odds_percentage`, `cuota`)
- [ ] La relación many-to-many de emparejamientos soporta matches asimétricos (monto fondeado ≠ monto a ganar)

**Criterio de cumplimiento:** El schema debe poder registrar apuestas donde `amount_locked ≠ amount_to_win`.

### Paso 4 — Verificar la lógica de emparejamiento (Matchmaker)
Buscar el motor de matchmaking en `lib/`, `app/api/`, o workers:
- [ ] Existe lógica separada para emparejar apuestas `DANDO` con `AGARRANDO`
- [ ] El sistema calcula el spread (diferencial) y lo asigna a la casa cuando `DANDO` se empareja con apostadores `PAREJA`
- [ ] El cálculo de pago usa el `target_amount` del ganador, no el `amount_locked` del perdedor como base única
- [ ] El corretaje del 10% se aplica sobre la **ganancia neta**, no sobre el monto fondeado

**Criterio de cumplimiento:** La función de resolución debe manejar los tres escenarios: Pareja vs Pareja, Dando vs Agarrando, y Dando vs agrupación de Pareja.

### Paso 5 — Verificar la UI del apostador (Front-end)
Buscar en `app/`, `components/`, o `apps/`:
- [ ] El modal o formulario de apuesta permite seleccionar la modalidad (Pareja / Dando / Agarrando)
- [ ] Al seleccionar `DANDO`, el UI pide: monto a fondear + porcentaje/cuota deseada
- [ ] Al seleccionar `AGARRANDO`, el UI muestra las apuestas `DANDO` disponibles para cazar
- [ ] Se muestra claramente al usuario cuánto está arriesgando vs cuánto puede ganar
- [ ] En "Mis Apuestas", las tarjetas de apuestas `DANDO`/`AGARRANDO` muestran la cuota pactada

**Criterio de cumplimiento:** El usuario no debe estar obligado a entrar en `PAREJA`; debe poder elegir modalidad en el flujo de apuesta.

### Paso 6 — Verificar el Panel de Administración
Buscar en rutas de admin (`app/admin/`, `app/dashboard/`, `apps/admin/`):
- [ ] El monitor de peleas muestra el volumen por modalidad (Pareja/Dando/Agarrando) para cada lado
- [ ] El spread acumulado a favor de la casa es visible en Auditoría/Métricas
- [ ] La resolución de pelea (Gana Rojo / Gana Verde / Tablas) aplica correctamente las fórmulas de pago para las tres modalidades

---

## Reporte de Cumplimiento

Una vez completados los pasos anteriores, generar un reporte con el siguiente formato:

```
## Auditoría — Requisito 6.5: Tipos de Apuestas y Gestión de Cuotas
Fecha: [fecha]
Repositorio: esjuliorafael/gallero

### Resumen Ejecutivo
[Cumple / Cumplimiento Parcial / No Cumple] — [1 línea explicativa]

### Checklist de Cumplimiento

| Sub-requisito | Estado | Evidencia (archivo:línea) | Notas |
|---|---|---|---|
| Enum/tipo de 3 modalidades | ✅/❌/⚠️ | | |
| Schema soporta monto fondeado ≠ meta de ganancia | ✅/❌/⚠️ | | |
| Matchmaker distingue DANDO/AGARRANDO | ✅/❌/⚠️ | | |
| Cálculo de spread → ganancia casa | ✅/❌/⚠️ | | |
| Corretaje 10% sobre ganancia neta | ✅/❌/⚠️ | | |
| UI: selector de modalidad en formulario de apuesta | ✅/❌/⚠️ | | |
| UI: muestra riesgo vs ganancia al usuario | ✅/❌/⚠️ | | |
| UI: listado de apuestas DANDO disponibles para Agarrar | ✅/❌/⚠️ | | |
| Admin: métricas de spread por pelea | ✅/❌/⚠️ | | |
| Resolución aplica fórmulas asimétricas | ✅/❌/⚠️ | | |

Leyenda: ✅ Implementado | ❌ No implementado | ⚠️ Implementado parcialmente

### Hallazgos Críticos
[Lista de gaps bloqueantes que impiden el cumplimiento del requisito]

### Hallazgos Menores
[Lista de mejoras recomendadas o detalles faltantes]

### Archivos Clave Identificados
[Lista de archivos relevantes encontrados durante la auditoría]

### Próximos Pasos Recomendados
[Lista priorizada de tareas para alcanzar el cumplimiento total]
```

---

## Notas de Negocio para el Revisor

- **Spread de la casa**: Cuando `Dando 1,000 al 80%` se cubre con apostadores Pareja (no con un Agarrando directo), los 200 MXN de diferencial deben ir a la casa. Este es un ingreso adicional al 10% de corretaje.
- **Corretaje siempre sobre la ganancia neta**: Si el Apostador 1 gana 800 MXN (fondeo del perdedor), el corretaje es 10% de 800 = 80 MXN. El Apostador 1 recibe neto: 800 - 80 = 720 MXN + recupera su capital fondeado.
- **El campo `odds_percentage` o `cuota` es crítico**: Sin él, el sistema no puede calcular cuánto debe pagar a cada parte en apuestas asimétricas.
- **Rollback parcial aplica a DANDO también**: Si la pelea cierra y la fracción "Dando" no encontró oponente, se devuelve el monto no emparejado al apostador.
