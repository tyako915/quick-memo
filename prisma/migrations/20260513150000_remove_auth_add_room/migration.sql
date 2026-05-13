-- Drop auth-related tables
DROP TABLE IF EXISTS "Account";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "VerificationToken";

-- Remove userId from Memo and add roomId
ALTER TABLE "Memo" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "Memo" ADD COLUMN "roomId" TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE "Memo" ALTER COLUMN "roomId" DROP DEFAULT;

-- Create index on roomId
CREATE INDEX "Memo_roomId_idx" ON "Memo"("roomId");

-- Drop User table (after Memo no longer references it)
DROP TABLE IF EXISTS "User";
