import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface GoalInputProps {
  value: string
  onChange: (value: string) => void
}

export function GoalInput({ value, onChange }: GoalInputProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-white w-20 shrink-0">
        Goal
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write API documentation"
        className={cn(
          "flex-1 rounded-md text-white placeholder:text-white/50",
          "bg-white/5 border-white/15 backdrop-blur-xl",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
          "focus-visible:border-white/25 focus-visible:ring-white/10"
        )}
      />
    </div>
  )
}

