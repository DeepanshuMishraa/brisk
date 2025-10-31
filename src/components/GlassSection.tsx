import { cn } from "@/lib/utils"

interface GlassSectionProps {
  className?: string
  children: React.ReactNode
}

export function GlassSection({ className, children }: GlassSectionProps) {
  return (
    <div
      className={cn(
        // Base glass look
        "relative rounded-xl border bg-white/5 border-white/10 text-white",
        // Inner highlight and blur to mimic macOS glass
        "backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        className
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          // Subtle radial lights (no obvious gradient banding)
          "[background:radial-gradient(1200px_600px_at_10%_0%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(800px_600px_at_80%_40%,rgba(255,255,255,0.04),transparent_60%),radial-gradient(600px_400px_at_50%_120%,rgba(0,0,0,0.2),transparent_60%)]"
        )}
      />
      {children}
    </div>
  )
}

export default GlassSection


