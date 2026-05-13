import RoomClient from "./RoomClient";

type Props = { params: Promise<{ roomId: string }> };

export default async function RoomPage({ params }: Props) {
  const { roomId } = await params;
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <a href="/" className="text-base font-bold text-gray-900 dark:text-white hover:opacity-80">
          QuickMemo
        </a>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block">スペース ID:</span>
          <code className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-mono">
            {roomId}
          </code>
          <CopyUrlButton />
        </div>
      </header>
      <main>
        <RoomClient roomId={roomId} />
      </main>
    </div>
  );
}

function CopyUrlButton() {
  return (
    <CopyUrl />
  );
}

// Client component for copy
import CopyUrl from "./CopyUrl";
