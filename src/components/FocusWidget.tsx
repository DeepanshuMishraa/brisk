import { useEffect, useRef, useState, useMemo } from "react";
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

function getResponsiveFontSize(textLength: number): string {
  if (textLength <= 20) return "text-sm"; // Default
  if (textLength <= 30) return "text-[13px]";
  if (textLength <= 40) return "text-xs";
  return "text-[11px]"; // Very long text
}

export function FocusWidget({ goal, duration, timeLeft }: FocusWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const progress =
    duration > 0 ? Math.min(((duration - timeLeft) / duration) * 100, 100) : 0;

  const goalFontSize = useMemo(
    () => getResponsiveFontSize(goal.length),
    [goal.length],
  );

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
      className="relative flex h-[72px] w-[380px] select-none rounded-2xl border border-gray-300/40 dark:border-white/[0.12] bg-white dark:bg-[#0a0a0a] shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] font-paper backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-px rounded-[15px] border border-gray-200/50 dark:border-white/[0.08]" />

      <div
        className="pointer-events-none absolute inset-[3px] rounded-[14px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-green-500/30 dark:via-green-400/30 dark:to-emerald-400/30 transition-[clip-path] duration-500 ease-out"
        style={{ clipPath: `inset(0 ${100 - progress}% 0 0 round 14px)` }}
      />

      <div
        className="pointer-events-none absolute inset-[3px] rounded-[14px] bg-gradient-to-b from-transparent via-transparent to-black/5 dark:to-white/5 transition-[clip-path] duration-500 ease-out"
        style={{ clipPath: `inset(0 ${100 - progress}% 0 0 round 14px)` }}
      />

      <div className="relative z-10 flex flex-1 items-center gap-3.5 px-5">
        <div className="shrink-0 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#151515] px-4 py-2.5 text-[17px] font-medium leading-none text-gray-900 dark:text-gray-50 shadow-sm border border-gray-200/50 dark:border-white/[0.08]">
          {formatTime(timeLeft)}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <span
            className={`block truncate ${goalFontSize} font-medium tracking-tight text-gray-800 dark:text-gray-100 leading-relaxed`}
          >
            {goal}
          </span>
        </div>
      </div>
    </div>
  );
}
