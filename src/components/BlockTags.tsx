import { useState, useEffect, useMemo, useRef } from "react"
import { invoke } from "@tauri-apps/api/core"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
  const [websitesInput, setWebsitesInput] = useState("")
  const [appsInput, setAppsInput] = useState("")
  const [debouncedValue, setDebouncedValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [appSuggestions, setAppSuggestions] = useState<InstalledApp[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const currentInput = activeTab === 'websites' ? websitesInput : appsInput

  // Debounce input value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(currentInput)
    }, 150)
    return () => clearTimeout(timer)
  }, [currentInput])

  // Get website suggestions
  const websiteSuggestions = useMemo(() => {
    if (!debouncedValue.trim() || activeTab !== 'websites') return []
    return searchSites(debouncedValue).slice(0, 5)
  }, [debouncedValue, activeTab])

  // Search for apps
  useEffect(() => {
    if (activeTab === 'apps' && debouncedValue.trim()) {
      invoke<InstalledApp[]>('search_apps', { query: debouncedValue })
        .then(apps => setAppSuggestions(apps))
        .catch(() => setAppSuggestions([]))
    } else {
      setAppSuggestions([])
    }
  }, [debouncedValue, activeTab])

  const currentSuggestions = activeTab === 'websites' ? websiteSuggestions : appSuggestions

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeTab === 'websites') setWebsitesInput(e.target.value)
    else setAppsInput(e.target.value)
    setShowSuggestions(true)
    setSelectedIndex(-1)
  }

  const handleSelectSite = (site: Site) => {
    onAddTag({
      id: Date.now().toString(),
      label: site.url || site.name,
      type: 'website'
    })
    setWebsitesInput("")
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleSelectApp = (app: InstalledApp) => {
    onAddTag({
      id: Date.now().toString(),
      label: app.display_name,
      type: 'app',
      executable: app.executable
    })
    setAppsInput("")
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleAddCustom = () => {
    if (currentInput.trim()) {
      onAddTag({
        id: Date.now().toString(),
        label: currentInput.trim(),
        type: activeTab === 'websites' ? 'website' : 'app',
        executable: activeTab === 'apps' ? currentInput.trim() : undefined
      })
      if (activeTab === 'websites') setWebsitesInput("")
      else setAppsInput("")
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || currentSuggestions.length === 0) {
      if (e.key === "Enter" && currentInput.trim()) {
        handleAddCustom()
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(p => p < currentSuggestions.length - 1 ? p + 1 : p)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(p => p > 0 ? p - 1 : -1)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0) {
        activeTab === 'websites' 
          ? handleSelectSite(currentSuggestions[selectedIndex] as Site)
          : handleSelectApp(currentSuggestions[selectedIndex] as InstalledApp)
      } else if (currentInput.trim()) {
        handleAddCustom()
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="flex items-start gap-4">
      <label className="text-sm font-medium text-gray-900 dark:text-white w-20 shrink-0 pt-2">Block</label>
      <div className="flex-1 relative space-y-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'websites' | 'apps')}>
          <TabsList className="w-fit">
            <TabsTrigger value="websites" className="gap-2">
              <Globe className="size-4" />
              Websites
            </TabsTrigger>
            <TabsTrigger value="apps" className="gap-2">
              <AppWindow className="size-4" />
              Apps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="websites" className="mt-3">
            <div className="bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-xl rounded-2xl p-3 min-h-[70px] flex items-start gap-2 flex-wrap relative">
              <div className="flex items-center gap-2 flex-wrap flex-1 w-full">
                {tags.filter(t => t.type === 'website').map(tag => (
                  <Badge key={tag.id} className="bg-gradient-to-br from-white/20 to-white/10 dark:from-white/15 dark:to-white/5 border border-white/30 dark:border-white/20 text-gray-900 dark:text-white rounded-full px-3 py-1.5 backdrop-blur-md shadow-[0_4px_16px_0_rgba(59,130,246,0.2)] flex items-center gap-2 h-8 text-xs font-medium">
                    <Globe className="size-3" />
                    <span>{tag.label}</span>
                    <button onClick={() => onRemoveTag(tag.id)} className="ml-1 hover:bg-white/20 dark:hover:bg-white/30 rounded-full p-0.5 transition-colors">
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                <Input ref={inputRef} value={websitesInput} onChange={handleInputChange} onKeyDown={handleKeyDown} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder="Type to search sites..." className="border-0 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 h-8 px-2 py-1 text-xs focus-visible:ring-0 focus-visible:outline-none flex-1 min-w-[150px]" />
              </div>
              <Button variant="ghost" size="icon" className="size-6 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white shrink-0 absolute top-2 right-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/15">
                <Info className="size-3.5" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="apps" className="mt-3">
            <div className="bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-xl rounded-2xl p-3 min-h-[70px] flex items-start gap-2 flex-wrap relative">
              <div className="flex items-center gap-2 flex-wrap flex-1 w-full">
                {tags.filter(t => t.type === 'app').map(tag => (
                  <Badge key={tag.id} className="bg-gradient-to-br from-red-500/20 to-red-400/10 dark:from-red-500/15 dark:to-red-400/5 border border-red-400/30 dark:border-red-400/20 text-red-900 dark:text-red-200 rounded-full px-3 py-1.5 backdrop-blur-md shadow-[0_4px_16px_0_rgba(239,68,68,0.2)] flex items-center gap-2 h-8 text-xs font-medium">
                    <AppWindow className="size-3" />
                    <span>{tag.label}</span>
                    <button onClick={() => onRemoveTag(tag.id)} className="ml-1 hover:bg-red-400/20 dark:hover:bg-red-400/30 rounded-full p-0.5 transition-colors">
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                <Input ref={inputRef} value={appsInput} onChange={handleInputChange} onKeyDown={handleKeyDown} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder="Type to search apps..." className="border-0 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 h-8 px-2 py-1 text-xs focus-visible:ring-0 focus-visible:outline-none flex-1 min-w-[150px]" />
              </div>
              <Button variant="ghost" size="icon" className="size-6 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white shrink-0 absolute top-2 right-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/15">
                <Info className="size-3.5" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {showSuggestions && currentSuggestions.length > 0 && (
          <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-black/80 border border-white/30 dark:border-white/20 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden">
            {activeTab === 'websites' 
              ? (currentSuggestions as Site[]).map((s, i) => (
                  <button key={`${s.name}-${i}`} onClick={() => handleSelectSite(s)} className={cn("w-full text-left px-4 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-2", i === selectedIndex && "bg-blue-500/15 dark:bg-blue-500/25")}>
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-gray-500 dark:text-white/50">({s.category})</span>
                  </button>
                ))
              : (currentSuggestions as InstalledApp[]).map((a, i) => (
                  <button key={`${a.name}-${i}`} onClick={() => handleSelectApp(a)} className={cn("w-full text-left px-4 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2", i === selectedIndex && "bg-red-500/15 dark:bg-red-500/25")}>
                    <span className="font-medium">{a.display_name}</span>
                    <span className="text-xs text-gray-500 dark:text-white/50">({a.categories.join(', ') || 'Application'})</span>
                  </button>
                ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
