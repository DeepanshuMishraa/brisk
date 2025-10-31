import { useState, useEffect, useMemo, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Users, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { searchSites, type Site } from "@/lib/constants"

interface Tag {
  id: string
  label: string
  icon?: React.ReactNode
}

interface BlockTagsProps {
  tags: Tag[]
  onRemoveTag: (id: string) => void
  onAddTag: (label: string) => void
}

export function BlockTags({ tags, onRemoveTag, onAddTag }: BlockTagsProps) {
  const [inputValue, setInputValue] = useState("")
  const [debouncedValue, setDebouncedValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounce input value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue)
    }, 150) // 150ms debounce

    return () => clearTimeout(timer)
  }, [inputValue])

  // Get suggestions based on debounced value
  const suggestions = useMemo(() => {
    if (!debouncedValue.trim()) return []
    return searchSites(debouncedValue).slice(0, 5) // Limit to 5 suggestions
  }, [debouncedValue])

  const getIcon = (label: string) => {
    if (label === "Messaging") return <MessageCircle className="size-3" />
    if (label === "Social Media") return <Users className="size-3" />
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setShowSuggestions(true)
    setSelectedIndex(-1)
  }

  const handleSelectSite = (site: Site) => {
    // Use URL if available, otherwise use name
    onAddTag(site.url || site.name)
    setInputValue("")
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleAddCustom = () => {
    if (inputValue.trim()) {
      onAddTag(inputValue.trim())
      setInputValue("")
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter" && inputValue.trim()) {
        handleAddCustom()
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSite(suggestions[selectedIndex])
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
      <label className="text-sm font-medium text-white w-20 shrink-0 pt-2">
        Block
      </label>
      <div className="flex-1 relative">
        <div className="bg-white/5 border border-white/15 backdrop-blur-xl rounded-md p-2 min-h-[60px] flex items-start gap-2 flex-wrap relative shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className={cn(
                  "bg-white/5 border-white/15 text-white rounded-md px-2 py-1 backdrop-blur-xl",
                  "flex items-center gap-1.5 h-7 text-xs"
                )}
              >
                {tag.icon || getIcon(tag.label)}
                <span>{tag.label}</span>
                <button
                  onClick={() => onRemoveTag(tag.id)}
                  className="ml-1 hover:bg-white/10 rounded-full p-0.5 transition-colors flex items-center justify-center"
                  aria-label={`Remove ${tag.label}`}
                >
                  <X className="size-3 text-white" />
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
              placeholder="Type to search sites..."
              className={cn(
                "border-0 bg-transparent text-white placeholder:text-white/30 h-7 px-2 py-1 text-xs",
                "focus-visible:ring-0 focus-visible:outline-none",
                "flex-1 min-w-[120px]"
              )}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-5 rounded-full text-gray-300 hover:text-white shrink-0 absolute top-2 right-2 bg-white/5 border border-white/10"
            )}
            aria-label="Information"
          >
            <Info className="size-3.5" />
          </Button>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-black/90 border border-white/15 backdrop-blur-xl rounded-md shadow-lg overflow-hidden"
          >
            {suggestions.map((site, index) => (
              <button
                key={`${site.name}-${index}`}
                onClick={() => handleSelectSite(site)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors",
                  "flex items-center gap-2",
                  index === selectedIndex && "bg-white/10"
                )}
              >
                <span className="font-medium">{site.name}</span>
                <span className="text-xs text-white/50">({site.category})</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

