import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ error: "roomId is required" }, { status: 400 });

  const memos = await prisma.memo.findMany({
    where: { roomId, deletedAt: null },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json(memos);
}

export async function POST(req: Request) {
  const { title, content, roomId } = await req.json();
  if (!roomId) return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  if (!content?.trim()) return NextResponse.json({ error: "Content is required" }, { status: 400 });

  const memo = await prisma.memo.create({
    data: { title: title ?? "", content, roomId },
  });
  return NextResponse.json(memo, { status: 201 });
}
