import { Suspense } from "react";
import { ControlRoomView } from "@/components/control-room/control-room-view";

export default function ControlRoomPage() {
  return (
    <Suspense fallback={null}>
      <ControlRoomView />
    </Suspense>
  );
}
