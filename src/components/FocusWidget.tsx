import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PhysicalPosition } from "@tauri-apps/api/window";

interface FocusWidgetProps {
  goal: string;
  duration: number;
  timeLeft: number;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function FocusWidget({ goal, duration, timeLeft }: FocusWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const progress =
    duration > 0 ? Math.min(((duration - timeLeft) / duration) * 100, 100) : 0;

  useEffect(() => {
    const handleMouseDown = async (e: MouseEvent) => {
      if (
        e.target !== widgetRef.current &&
        !widgetRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setIsDragging(true);
      try {
        const window = getCurrentWindow();
        const position = await window.outerPosition();
        dragStartPos.current = {
          x: e.screenX - position.x,
          y: e.screenY - position.y,
        };
      } catch (error) {
        console.error("Failed to get window position:", error);
      }
    };

    const handleMouseMove = async (e: MouseEvent) => {
      if (isDragging) {
        try {
          const window = getCurrentWindow();
          await window.setPosition(
            new PhysicalPosition(
              e.screenX - dragStartPos.current.x,
              e.screenY - dragStartPos.current.y,
            ),
          );
        } catch (error) {
          console.error("Failed to set window position:", error);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const widget = widgetRef.current;
    if (widget) {
      widget.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      if (widget) {
        widget.removeEventListener("mousedown", handleMouseDown);
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={widgetRef}
      className="relative flex h-[72px] w-[380px] select-none rounded-2xl border border-gray-300/30 dark:border-white/8 bg-white dark:bg-[#0f0f0f] shadow-[0_16px_45px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.45)] font-paper"
    >
      <div className="pointer-events-none absolute inset-px rounded-[22px] border border-gray-300/30 dark:border-white/10" />
      <div
        className="pointer-events-none absolute inset-1 rounded-[22px] bg-gray-900/10 dark:bg-white/4 transition-[clip-path] duration-500 ease-out"
        style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
      />
      <div className="relative z-10 flex flex-1 items-center gap-4 px-6">
        <div className="shrink-0 rounded-xl bg-gray-100 dark:bg-[#181818] px-4 py-2.5 text-lg leading-none text-gray-900 dark:text-gray-100">
          {formatTime(timeLeft)}
        </div>
        <div className="flex-1 min-w-0">
          <span className="block truncate text-sm tracking-tight text-gray-700 dark:text-gray-200/90">
            {goal}
          </span>
        </div>
      </div>
    </div>
  );
}
