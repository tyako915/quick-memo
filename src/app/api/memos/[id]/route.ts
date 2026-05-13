import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { title, content } = await req.json();

  const existing = await prisma.memo.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const memo = await prisma.memo.update({
    where: { id },
    data: { title: title ?? existing.title, content: content ?? existing.content },
  });
  return NextResponse.json(memo);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.memo.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.memo.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
