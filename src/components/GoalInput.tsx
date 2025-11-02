import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface GoalInputProps {
  value: string
  onChange: (value: string) => void
}

export function GoalInput({ value, onChange }: GoalInputProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-gray-900 dark:text-white w-20 shrink-0">
        Goal
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write API documentation"
        className={cn(
          "flex-1 rounded-md text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50",
          "bg-gray-100/50 dark:bg-white/5 border-gray-300/30 dark:border-white/15 backdrop-blur-xl",
          "shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
          "focus-visible:border-gray-400/50 dark:focus-visible:border-white/25 focus-visible:ring-gray-400/20 dark:focus-visible:ring-white/10"
        )}
      />
    </div>
  )
}

