"use client";

import { useState } from "react";

type Props = { onCreated: () => void };

export default function NewMemoForm({ onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await fetch("/api/memos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    setTitle("");
    setContent("");
    setLoading(false);
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-4 flex flex-col gap-2">
      <input
        className="text-sm w-full bg-transparent outline-none border-b border-blue-200 dark:border-blue-700 pb-1 placeholder-gray-400"
        placeholder="タイトル（任意）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="text-sm w-full bg-transparent outline-none resize-none min-h-[80px] placeholder-gray-400"
        placeholder="メモを入力... (Ctrl+Enter で保存)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit(e);
        }}
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="self-end text-xs px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "保存中..." : "追加"}
      </button>
    </form>
  );
}
