import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)\s*(minute|hour|minutes|hours)/i);
  if (!match) return 3600;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (unit.includes("hour")) {
    return value * 3600;
  } else if (unit.includes("minute")) {
    return value * 60;
  }

  return 3600; 
}
