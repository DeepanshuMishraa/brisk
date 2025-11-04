import { useState, useEffect, useMemo, useRef } from "react"
import { invoke } from "@tauri-apps/api/core"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Globe, AppWindow, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { searchSites, type Site } from "@/lib/constants"
import type { Tag, InstalledApp } from "@/lib/types"

interface BlockTagsProps {
  tags: Tag[]
  onRemoveTag: (id: string) => void
  onAddTag: (tag: Tag) => void
}

export function BlockTags({ tags, onRemoveTag, onAddTag }: BlockTagsProps) {
  const [activeTab, setActiveTab] = useState<'websites' | 'apps'>('websites')
  const [inputValue, setInputValue] = useState("")
  const [debouncedValue, setDebouncedValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [appSuggestions, setAppSuggestions] = useState<InstalledApp[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounce input value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue)
    }, 150) // 150ms debounce

    return () => clearTimeout(timer)
  }, [inputValue])

  // Get website suggestions based on debounced value
  const websiteSuggestions = useMemo(() => {
    if (!debouncedValue.trim() || activeTab !== 'websites') return []
    return searchSites(debouncedValue).slice(0, 5)
  }, [debouncedValue, activeTab])

  // Search for apps when input changes
  useEffect(() => {
    if (activeTab === 'apps' && debouncedValue.trim()) {
      invoke<InstalledApp[]>('search_apps', { query: debouncedValue })
        .then(apps => setAppSuggestions(apps))
        .catch(err => {
          console.error('Failed to search apps:', err)
          setAppSuggestions([])
        })
    } else {
      setAppSuggestions([])
    }
  }, [debouncedValue, activeTab])

  const getIcon = (type: 'website' | 'app') => {
    if (type === 'app') return <AppWindow className="size-3" />
    return <Globe className="size-3" />
  }

  const currentSuggestions = activeTab === 'websites' ? websiteSuggestions : appSuggestions

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setShowSuggestions(true)
    setSelectedIndex(-1)
  }

  const handleSelectSite = (site: Site) => {
    onAddTag({
      id: Date.now().toString(),
      label: site.url || site.name,
      type: 'website'
    })
    setInputValue("")
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleSelectApp = (app: InstalledApp) => {
    onAddTag({
      id: Date.now().toString(),
      label: app.display_name,
      type: 'app',
      executable: app.executable
    })
    setInputValue("")
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleAddCustom = () => {
    if (inputValue.trim()) {
      onAddTag({
        id: Date.now().toString(),
        label: inputValue.trim(),
        type: activeTab === 'websites' ? 'website' : 'app',
        executable: activeTab === 'apps' ? inputValue.trim() : undefined
      })
      setInputValue("")
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || currentSuggestions.length === 0) {
      if (e.key === "Enter" && inputValue.trim()) {
        handleAddCustom()
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < currentSuggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < currentSuggestions.length) {
        if (activeTab === 'websites') {
          handleSelectSite(currentSuggestions[selectedIndex] as Site)
        } else {
          handleSelectApp(currentSuggestions[selectedIndex] as InstalledApp)
        }
      } else if (inputValue.trim()) {
        handleAddCustom()
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  const handleInputBlur = () => {
    // Delay to allow click on suggestions
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  return (
    <div className="flex items-start gap-4">
      <label className="text-sm font-medium text-gray-900 dark:text-white w-20 shrink-0 pt-2">
        Block
      </label>
      <div className="flex-1 relative space-y-2">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100/50 dark:bg-white/5 border border-gray-300/30 dark:border-white/15 backdrop-blur-xl rounded-md p-1">
          <button
            onClick={() => setActiveTab('websites')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors",
              activeTab === 'websites'
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Globe className="size-3.5" />
            Websites
          </button>
          <button
            onClick={() => setActiveTab('apps')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors",
              activeTab === 'apps'
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <AppWindow className="size-3.5" />
            Apps
          </button>
        </div>

        {/* Tags Input */}
        <div className="bg-gray-100/50 dark:bg-white/5 border border-gray-300/30 dark:border-white/15 backdrop-blur-xl rounded-md p-2 min-h-[60px] flex items-start gap-2 flex-wrap relative shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {tags.filter(tag => tag.type === activeTab.slice(0, -1) as 'website' | 'app').map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className={cn(
                  "bg-gray-200/50 dark:bg-white/5 border-gray-300/30 dark:border-white/15 text-gray-900 dark:text-white rounded-md px-2 py-1 backdrop-blur-xl",
                  "flex items-center gap-1.5 h-7 text-xs"
                )}
              >
                {getIcon(tag.type)}
                <span>{tag.label}</span>
                <button
                  onClick={() => onRemoveTag(tag.id)}
                  className="ml-1 hover:bg-gray-300/30 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors flex items-center justify-center"
                  aria-label={`Remove ${tag.label}`}
                >
                  <X className="size-3 text-gray-900 dark:text-white" />
                </button>
              </Badge>
            ))}
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={handleInputBlur}
              placeholder={activeTab === 'websites' ? "Type to search sites..." : "Type to search apps..."}
              className={cn(
                "border-0 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 h-7 px-2 py-1 text-xs",
                "focus-visible:ring-0 focus-visible:outline-none",
                "flex-1 min-w-[120px]"
              )}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-5 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white shrink-0 absolute top-2 right-2 bg-gray-200/50 dark:bg-white/5 border border-gray-300/30 dark:border-white/10"
            )}
            aria-label="Information"
          >
            <Info className="size-3.5" />
          </Button>
        </div>

        {/* Suggestions */}
        {showSuggestions && currentSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-black/90 border border-gray-300/30 dark:border-white/15 backdrop-blur-xl rounded-md shadow-lg overflow-hidden"
          >
            {activeTab === 'websites' 
              ? (currentSuggestions as Site[]).map((site, index) => (
                  <button
                    key={`${site.name}-${index}`}
                    onClick={() => handleSelectSite(site)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors",
                      "flex items-center gap-2",
                      index === selectedIndex && "bg-gray-100 dark:bg-white/10"
                    )}
                  >
                    <span className="font-medium">{site.name}</span>
                    <span className="text-xs text-gray-500 dark:text-white/50">({site.category})</span>
                  </button>
                ))
              : (currentSuggestions as InstalledApp[]).map((app, index) => (
                  <button
                    key={`${app.name}-${index}`}
                    onClick={() => handleSelectApp(app)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors",
                      "flex items-center gap-2",
                      index === selectedIndex && "bg-gray-100 dark:bg-white/10"
                    )}
                  >
                    <span className="font-medium">{app.display_name}</span>
                    <span className="text-xs text-gray-500 dark:text-white/50">
                      ({app.categories.join(', ') || 'Application'})
                    </span>
                  </button>
                ))
            }
          </div>
        )}
      </div>
    </div>
  )
}

