"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [roomInput, setRoomInput] = useState("");

  function createRoom() {
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    router.push(`/room/${id}`);
  }

  function joinRoom() {
    const trimmed = roomInput.trim();
    if (!trimmed) return;
    // URL全体が貼り付けられた場合にも対応
    const match = trimmed.match(/\/room\/([a-zA-Z0-9]+)/);
    const roomId = match ? match[1] : trimmed;
    router.push(`/room/${roomId}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-sm w-full">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">QuickMemo</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
          URLを共有するだけで、どのデバイスからでも同じメモにアクセスできます。
        </p>

        <button
          onClick={createRoom}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition mb-6"
        >
          ＋ 新しいメモスペースを作成
        </button>

        <div className="relative mb-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 w-fit mx-auto">
            または
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <input
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="スペースのIDまたはURLを入力"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
          />
          <button
            onClick={joinRoom}
            className="px-4 py-2 rounded-lg bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition"
          >
            参加
          </button>
        </div>
      </div>
    </main>
  );
}
