import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getState(roomId: string) {
  const [memos, trash] = await Promise.all([
    prisma.memo.findMany({
      where: { roomId, deletedAt: null },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.memo.findMany({
      where: { roomId, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
    }),
  ]);
  const now = Date.now();
  const trashWithDays = trash.map((m) => {
    const expiresAt = m.deletedAt!.getTime() + 30 * 24 * 60 * 60 * 1000;
    return { ...m, daysLeft: Math.max(0, Math.ceil((expiresAt - now) / 86400000)) };
  });
  return { memos, trash: trashWithDays };
}

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) return new Response("roomId required", { status: 400 });

  const encoder = new TextEncoder();
  let lastHash = "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // 初回送信
      const initial = await getState(roomId);
      lastHash = JSON.stringify(initial);
      send("init", initial);

      // 3秒ごとに変更チェック
      const interval = setInterval(async () => {
        try {
          const state = await getState(roomId);
          const hash = JSON.stringify(state);
          if (hash !== lastHash) {
            lastHash = hash;
            send("update", state);
          }
        } catch {
          clearInterval(interval);
          try { controller.close(); } catch {}
        }
      }, 3000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
