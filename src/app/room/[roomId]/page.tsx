import RoomClient from "./RoomClient";

type Props = { params: Promise<{ roomId: string }> };

export default async function RoomPage({ params }: Props) {
  const { roomId } = await params;
  return <RoomClient roomId={roomId} />;
}
