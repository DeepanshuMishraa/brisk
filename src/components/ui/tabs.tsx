import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-10 w-fit items-center justify-center rounded-2xl p-1 bg-gray-100/50 dark:bg-black/50 backdrop-blur-xl border border-gray-300/30 dark:border-white/10",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        // Inactive state
        "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300",
        // Active state
        "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-3xl data-[state=active]:border data-[state=active]:border-gray-300/50 dark:data-[state=active]:border-white/30",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
