import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DurationSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function DurationSelect({ value, onValueChange }: DurationSelectProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-white w-20 shrink-0">
        Duration
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={cn(
            "flex-1 rounded-md text-white w-full",
            "bg-black/70 border-white/15 backdrop-blur-xl",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
            "focus-visible:border-white/25 focus-visible:ring-white/10",
          )}
        >
          <SelectValue placeholder="Select duration" />
        </SelectTrigger>
        <SelectContent className="bg-black/70 border-white/15 text-white backdrop-blur-xl">
          <SelectItem
            value="1 minute"
            className={cn(
              "text-white",
              "focus:bg-white/5 focus:backdrop-blur-xl",
              "focus:border-white/10 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
            )}
          >
            1 minute
          </SelectItem>
          <SelectItem
            value="15 minutes"
            className={cn(
              "text-white",
              "focus:bg-white/5 focus:backdrop-blur-xl",
              "focus:border-white/10 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
            )}
          >
            15 minutes
          </SelectItem>
          <SelectItem
            value="30 minutes"
            className={cn(
              "text-white",
              "focus:bg-white/5 focus:backdrop-blur-xl",
              "focus:border-white/10 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
            )}
          >
            30 minutes
          </SelectItem>
          <SelectItem
            value="1 hour"
            className={cn(
              "text-white",
              "focus:bg-white/5 focus:backdrop-blur-xl",
              "focus:border-white/10 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
            )}
          >
            1 hour
          </SelectItem>
          <SelectItem
            value="2 hours"
            className={cn(
              "text-white",
              "focus:bg-white/5 focus:backdrop-blur-xl",
              "focus:border-white/10 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
            )}
          >
            2 hours
          </SelectItem>
          <SelectItem
            value="3 hours"
            className={cn(
              "text-white",
              "focus:bg-white/5 focus:backdrop-blur-xl",
              "focus:border-white/10 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
            )}
          >
            3 hours
          </SelectItem>
          <SelectItem
            value="4 hours"
            className={cn(
              "text-white",
              "focus:bg-white/5 focus:backdrop-blur-xl",
              "focus:border-white/10 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
            )}
          >
            4 hours
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
