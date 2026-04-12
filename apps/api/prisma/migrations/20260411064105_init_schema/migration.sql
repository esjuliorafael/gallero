-- CreateEnum
CREATE TYPE "FightStatus" AS ENUM ('OPEN', 'CLOSED', 'RESOLVING', 'FINISHED_RED', 'FINISHED_GREEN', 'FINISHED_DRAW', 'CANCELED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'PARTIALLY_MATCHED', 'MATCHED', 'SETTLED', 'CANCELED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('DEPOSIT_APPROVED', 'WITHDRAWAL_REQUESTED', 'WITHDRAWAL_COMPLETED', 'BET_STAKE_FROZEN', 'BET_STAKE_RELEASED', 'WINNING_PAYOUT', 'HOUSE_BROKERAGE_FEE', 'HOUSE_SPREAD_PROFIT');

-- CreateEnum
CREATE TYPE "BetSide" AS ENUM ('RED', 'GREEN');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BETTOR', 'ADMIN', 'HOUSE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'BETTOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "balance_available" DECIMAL(65,30) NOT NULL,
    "balance_frozen" DECIMAL(65,30) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reference_type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fights" (
    "id" TEXT NOT NULL,
    "red_party_name" TEXT NOT NULL,
    "green_party_name" TEXT NOT NULL,
    "status" "FightStatus" NOT NULL DEFAULT 'OPEN',
    "resolving_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bet_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fight_id" TEXT NOT NULL,
    "side" "BetSide" NOT NULL,
    "amount_staked" DECIMAL(65,30) NOT NULL,
    "target_win_amount" DECIMAL(65,30) NOT NULL,
    "unmatched_staked_amount" DECIMAL(65,30) NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bet_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bet_matches" (
    "id" TEXT NOT NULL,
    "fight_id" TEXT NOT NULL,
    "total_red_staked" DECIMAL(65,30) NOT NULL,
    "total_green_staked" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bet_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bet_match_legs" (
    "id" TEXT NOT NULL,
    "bet_match_id" TEXT NOT NULL,
    "bet_order_id" TEXT NOT NULL,
    "side" "BetSide" NOT NULL,
    "amount_staked_contributed" DECIMAL(65,30) NOT NULL,
    "target_win_contributed" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "bet_match_legs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "otp_codes_phone_idx" ON "otp_codes"("phone");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_orders" ADD CONSTRAINT "bet_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_orders" ADD CONSTRAINT "bet_orders_fight_id_fkey" FOREIGN KEY ("fight_id") REFERENCES "fights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_matches" ADD CONSTRAINT "bet_matches_fight_id_fkey" FOREIGN KEY ("fight_id") REFERENCES "fights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_match_legs" ADD CONSTRAINT "bet_match_legs_bet_match_id_fkey" FOREIGN KEY ("bet_match_id") REFERENCES "bet_matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_match_legs" ADD CONSTRAINT "bet_match_legs_bet_order_id_fkey" FOREIGN KEY ("bet_order_id") REFERENCES "bet_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
