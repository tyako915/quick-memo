import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ゴミ箱一覧
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ error: "roomId is required" }, { status: 400 });

  const memos = await prisma.memo.findMany({
    where: { roomId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
  });
  return NextResponse.json(memos);
}
