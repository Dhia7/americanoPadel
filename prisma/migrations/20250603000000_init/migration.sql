-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "ScoringMode" AS ENUM ('FIXED', 'TIMED');

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "scoringMode" "ScoringMode" NOT NULL,
    "pointsPerMatch" INTEGER NOT NULL DEFAULT 24,
    "durationMinutes" INTEGER,
    "totalRounds" INTEGER NOT NULL,
    "courtCount" INTEGER NOT NULL DEFAULT 1,
    "pinHash" TEXT,
    "autoAdvanceRounds" BOOLEAN NOT NULL DEFAULT true,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "court" INTEGER NOT NULL DEFAULT 1,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "player3Id" TEXT NOT NULL,
    "player4Id" TEXT NOT NULL,
    "teamAPoints" INTEGER,
    "teamBPoints" INTEGER,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Player_tournamentId_idx" ON "Player"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Round_tournamentId_number_key" ON "Round"("tournamentId", "number");

-- CreateIndex
CREATE INDEX "Match_roundId_idx" ON "Match"("roundId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player4Id_fkey" FOREIGN KEY ("player4Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
