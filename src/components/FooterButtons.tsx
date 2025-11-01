import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

interface FooterButtonsProps {
  isSessionActive?: boolean;
  timeLeft?: number | null;
  isLoading?: boolean;
  onStartFocus?: () => void;
  onViewStats?: () => void;
}

export function FooterButtons({
  isSessionActive = false,
  isLoading = false,
  onStartFocus,
  onViewStats,
}: FooterButtonsProps) {
  return (
    <div className="flex items-center justify-between gap-2 w-full border-t pt-4">
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={onStartFocus}
          variant="ghost"
          disabled={isLoading || isSessionActive}
          style={{ boxShadow: "none !important" }}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Starting...</span>
            </>
          ) : (
            <>
              <RefreshCw className="size-4" />
              <span>Start Focus Session</span>
            </>
          )}
        </Button>
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={onViewStats}
        disabled={isSessionActive}
      >
        <span>View Stats</span>
      </Button>
    </div>
  );
}
