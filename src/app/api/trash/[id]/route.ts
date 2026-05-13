import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// 復元
export async function PATCH(_req: Request, { params }: Params) {
  const { id } = await params;
  const memo = await prisma.memo.update({ where: { id }, data: { deletedAt: null } });
  return NextResponse.json(memo);
}

// 完全削除
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await prisma.memo.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
