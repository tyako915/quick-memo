import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ error: "roomId is required" }, { status: 400 });

  const now = new Date();
  const memos = await prisma.memo.findMany({
    where: { roomId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
  });

  // 残日数を付与
  const withDaysLeft = memos.map((m) => {
    const deletedAt = m.deletedAt!;
    const expiresAt = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return { ...m, daysLeft };
  });

  return NextResponse.json(withDaysLeft);
}
