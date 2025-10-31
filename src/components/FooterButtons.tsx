import { Button } from "@/components/ui/button";
import { RefreshCw, Square, Loader2 } from "lucide-react";

interface FooterButtonsProps {
  isSessionActive?: boolean;
  timeLeft?: number | null;
  isLoading?: boolean;
  onStartFocus?: () => void;
  onStopFocus?: () => void;
  onStartNew?: () => void;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function FooterButtons({
  isSessionActive = false,
  timeLeft = null,
  isLoading = false,
  onStartFocus,
  onStopFocus,
  onStartNew,
}: FooterButtonsProps) {
  return (
    <div className="flex items-center justify-between gap-2 w-full border-t pt-4">
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={isSessionActive ? onStopFocus : onStartFocus}
          variant="ghost"
          disabled={isLoading}
          style={{ boxShadow: "none !important" }}
          className={isSessionActive ? "text-red-400 hover:text-red-300" : ""}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>{isSessionActive ? "Stopping..." : "Starting..."}</span>
            </>
          ) : isSessionActive ? (
            <>
              <Square className="size-4" />
              <span>Stop Focus Session</span>
            </>
          ) : (
            <>
              <RefreshCw className="size-4" />
              <span>Start Focus Session</span>
            </>
          )}
        </Button>
        {isSessionActive && timeLeft !== null && !isLoading && (
          <span className="text-xl font-mono text-white font-semibold">
            {formatTime(timeLeft)}
          </span>
        )}
      </div>

      <Button size="sm" variant="ghost" onClick={onStartNew} disabled={isSessionActive}>
        <span>Start New Session</span>
        <div className="flex items-center gap-1 ml-1">
          <kbd className="px-1.5 py-0.5 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-[10px] font-mono text-gray-400">
            ⌘
          </kbd>
          <span className="text-gray-400 text-xs">+</span>
          <kbd className="px-1.5 py-0.5 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-[10px] font-mono text-gray-400">
            J
          </kbd>
        </div>
      </Button>
    </div>
  );
}
