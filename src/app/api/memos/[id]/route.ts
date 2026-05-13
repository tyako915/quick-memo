import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const { title, content } = await req.json();

  const existing = await prisma.memo.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const memo = await prisma.memo.update({
    where: { id },
    data: { title: title ?? existing.title, content: content ?? existing.content },
  });
  return NextResponse.json(memo);
}

// ピン留めトグル
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const { pinned } = await req.json();

  const memo = await prisma.memo.update({ where: { id }, data: { pinned } });
  return NextResponse.json(memo);
}

// ソフトデリート
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  const existing = await prisma.memo.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.memo.update({ where: { id }, data: { deletedAt: new Date() } });
  return new NextResponse(null, { status: 204 });
}
