import { Button } from "@/components/ui/button";
import { Play, BarChart3, Loader2 } from "lucide-react";

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
    <div className="flex items-center gap-3 w-full">
      <Button
        onClick={onStartFocus}
        disabled={isLoading || isSessionActive}
        className="flex-1 h-11 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            <span>Starting...</span>
          </>
        ) : (
          <>
            <Play className="size-4 mr-2 fill-current" />
            <span>Start Focus</span>
          </>
        )}
      </Button>

      <Button
        onClick={onViewStats}
        disabled={isSessionActive}
        variant="outline"
        className="h-11 px-5 border-gray-300/50 dark:border-white/20 hover:bg-gray-100/50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <BarChart3 className="size-4 mr-2" />
        <span>Stats</span>
      </Button>
    </div>
  );
}
