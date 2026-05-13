"use client";

import { useCallback, useEffect, useState } from "react";
import MemoCard from "@/components/MemoCard";
import NewMemoForm from "@/components/NewMemoForm";

type Memo = { id: string; title: string; content: string; updatedAt: string };

export default function DashboardClient() {
  const [memos, setMemos] = useState<Memo[]>([]);

  const fetchMemos = useCallback(async () => {
    const res = await fetch("/api/memos");
    if (res.ok) setMemos(await res.json());
  }, []);

  useEffect(() => {
    fetchMemos();
    const interval = setInterval(fetchMemos, 3000);
    return () => clearInterval(interval);
  }, [fetchMemos]);

  async function handleUpdate(id: string, title: string, content: string) {
    await fetch(`/api/memos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    fetchMemos();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/memos/${id}`, { method: "DELETE" });
    setMemos((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <NewMemoForm onCreated={fetchMemos} />
      {memos.length === 0 ? (
        <p className="text-sm text-center text-gray-400 py-8">メモがありません。最初のメモを追加しましょう！</p>
      ) : (
        memos.map((memo) => (
          <MemoCard
            key={memo.id}
            memo={memo}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  );
}
