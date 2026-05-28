/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "imageUrl";

-- CreateTable
CREATE TABLE "PostDocument" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" INTEGER NOT NULL,

    CONSTRAINT "PostDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PostDocument" ADD CONSTRAINT "PostDocument_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
