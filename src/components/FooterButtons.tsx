import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterButtonsProps {
  onStartFocus?: () => void;
  onStartNew?: () => void;
}

export function FooterButtons({
  onStartFocus,
  onStartNew,
}: FooterButtonsProps) {
  return (
    <div className="flex items-center justify-between gap-2 w-full">
      <Button
        size="sm"
        onClick={onStartFocus}
        variant="ghost"
        style={{ boxShadow: "none !important" }}
      >
        <RefreshCw className="size-4" />
        <span>Start Focus Session</span>
      </Button>

      <Button size="sm" variant="ghost" onClick={onStartNew}>
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
