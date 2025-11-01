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
  const progress = Math.min(((duration - timeLeft) / duration) * 100, 100);

  useEffect(() => {
    const handleMouseDown = async (e: MouseEvent) => {
      if (e.target !== widgetRef.current && !widgetRef.current?.contains(e.target as Node)) {
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
              e.screenY - dragStartPos.current.y
            )
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
      className="relative w-full h-full max-w-[400px] max-h-[80px] rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-xl overflow-hidden cursor-move select-none"
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        width: "400px",
        height: "80px",
      }}
    >
      <div className="absolute inset-0 bg-[#1a1a1a]" />
      <div
        className="absolute inset-0 transition-all duration-300 ease-out"
        style={{
          background: "linear-gradient(90deg, rgba(34, 197, 94, 0.95) 0%, rgba(74, 222, 128, 0.95) 50%, rgba(34, 197, 94, 0.95) 100%)",
          clipPath: `inset(0 ${100 - progress}% 0 0)`,
          willChange: "clip-path",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300 ease-out"
        style={{
          background: `linear-gradient(90deg, 
            transparent 0%, 
            rgba(34, 197, 94, 0.5) ${Math.max(0, progress - 5)}%, 
            rgba(74, 222, 128, 0.8) ${Math.max(0, progress - 2)}%, 
            rgba(34, 197, 94, 0.6) ${progress}%, 
            rgba(74, 222, 128, 0.4) ${Math.min(100, progress + 2)}%, 
            transparent 100%)`,
          willChange: "background",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-30 transition-all duration-300 ease-out"
        style={{
          background: `linear-gradient(180deg, 
            rgba(255, 255, 255, 0.2) 0%, 
            transparent 50%)`,
          clipPath: `inset(0 ${100 - progress}% 0 0)`,
          willChange: "clip-path",
        }}
      />
      <div className="relative z-10 flex items-center h-full px-5 gap-4">
        <div className="shrink-0 px-4 py-2.5 rounded-full bg-[#252525] border border-white/5 shadow-inner">
          <span className="text-lg font-mono text-gray-200 font-semibold leading-none whitespace-nowrap">
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="flex-1 overflow-hidden min-w-0 pr-2">
          <span className="text-base text-gray-200 font-medium truncate block leading-tight">
            {goal}
          </span>
        </div>
      </div>
    </div>
  );
}

