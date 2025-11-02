import { cn } from "@/lib/utils"

interface GlassSectionProps {
  className?: string
  children: React.ReactNode
}

export function GlassSection({ className, children }: GlassSectionProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border bg-gray-100/50 dark:bg-white/5 border-gray-300/30 dark:border-white/10 text-gray-900 dark:text-white",
        "backdrop-blur-xl shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        className
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 hidden dark:block",
          "[background:radial-gradient(1200px_600px_at_10%_0%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(800px_600px_at_80%_40%,rgba(255,255,255,0.04),transparent_60%),radial-gradient(600px_400px_at_50%_120%,rgba(0,0,0,0.2),transparent_60%)]"
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 block dark:hidden",
          "[background:radial-gradient(1200px_600px_at_10%_0%,rgba(255,255,255,0.15),transparent_60%),radial-gradient(800px_600px_at_80%_40%,rgba(255,255,255,0.1),transparent_60%),radial-gradient(600px_400px_at_50%_120%,rgba(0,0,0,0.05),transparent_60%)]"
        )}
      />
      {children}
    </div>
  )
}

export default GlassSection


