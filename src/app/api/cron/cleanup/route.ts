import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.memo.deleteMany({
    where: { deletedAt: { lte: threshold } },
  });

  return NextResponse.json({ deleted: count });
}
