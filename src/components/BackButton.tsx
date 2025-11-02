import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "size-9 rounded-md bg-gray-100/50 dark:bg-white/5 hover:bg-gray-200/50 dark:hover:bg-white/10 text-gray-900 dark:text-white border border-gray-300/30 dark:border-white/15 backdrop-blur-xl shadow-none",
      )}
    >
      <ArrowLeft className="size-4" />
    </Button>
  );
}
