import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ShieldBan, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BlockNotification {
  appName: string;
  timestamp: number;
}

interface BlockNotificationWidgetProps {
  isActive: boolean;
  onClose?: () => void;
}

export function BlockNotificationWidget({ isActive, onClose }: BlockNotificationWidgetProps) {
  const [notifications, setNotifications] = useState<BlockNotification[]>([])
  const [currentNotification, setCurrentNotification] = useState<BlockNotification | null>(null)

  useEffect(() => {
    if (!isActive) {
      setNotifications([])
      setCurrentNotification(null)
      return
    }

    // Listen for window events from Rust backend
    const handleBlockEvent = (event: CustomEvent) => {
      const appName = event.detail.appName as string
      const newNotification: BlockNotification = {
        appName,
        timestamp: Date.now()
      }
      
      setNotifications(prev => [...prev, newNotification])
      setCurrentNotification(newNotification)

      // Auto-hide after 3 seconds
      setTimeout(() => {
        setCurrentNotification(null)
      }, 3000)
    }

    // @ts-expect-error - Custom event
    window.addEventListener('app-blocked', handleBlockEvent)

    return () => {
      // @ts-expect-error - Custom event
      window.removeEventListener('app-blocked', handleBlockEvent)
    }
  }, [isActive])

  // Group notifications by app name for count
  const blockCounts = notifications.reduce((acc, notif) => {
    acc[notif.appName] = (acc[notif.appName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalBlocks = notifications.length

  if (!isActive) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <AnimatePresence mode="wait">
        {currentNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto"
          >
            <div className={cn(
              "bg-red-500/95 dark:bg-red-600/95 backdrop-blur-xl",
              "border border-red-600/50 dark:border-red-500/50",
              "rounded-lg shadow-2xl",
              "px-4 py-3",
              "flex items-center gap-3",
              "min-w-[320px] max-w-[400px]"
            )}>
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="bg-white/20 rounded-full p-2">
                  <ShieldBan className="size-5 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">
                  App Blocked
                </p>
                <p className="text-xs text-white/90 truncate">
                  <span className="font-medium">{currentNotification.appName}</span> is blocked during your focus session
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => setCurrentNotification(null)}
                className="flex-shrink-0 hover:bg-white/10 rounded-full p-1 transition-colors"
                aria-label="Dismiss"
              >
                <X className="size-4 text-white" />
              </button>
            </div>

            {/* Block counter badge */}
            {totalBlocks > 1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 rounded-full size-7 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-red-500"
              >
                {totalBlocks}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary widget (always visible when active) */}
      {!currentNotification && totalBlocks > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-auto"
        >
          <div className={cn(
            "bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-xl",
            "border border-gray-700/50",
            "rounded-lg shadow-lg",
            "px-3 py-2",
            "flex items-center gap-2"
          )}>
            <ShieldBan className="size-4 text-red-400" />
            <span className="text-xs text-gray-300 font-medium">
              {totalBlocks} block{totalBlocks > 1 ? 's' : ''}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="hover:bg-white/10 rounded-full p-0.5 transition-colors ml-1"
                aria-label="Clear"
              >
                <X className="size-3 text-gray-400" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
