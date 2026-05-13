import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memos = await prisma.memo.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(memos);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content is required" }, { status: 400 });

  const memo = await prisma.memo.create({
    data: { title: title ?? "", content, userId: session.user.id },
  });
  return NextResponse.json(memo, { status: 201 });
}
