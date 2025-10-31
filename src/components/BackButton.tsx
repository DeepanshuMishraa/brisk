import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function BackButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "size-9 rounded-md bg-white/5 hover:bg-white/10 text-white border border-white/15 backdrop-blur-xl shadow-none"
      )}
    >
      <ArrowLeft className="size-4" />
    </Button>
  )
}

