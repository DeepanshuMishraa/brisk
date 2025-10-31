import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle, Users, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Tag {
  id: string
  label: string
  icon?: React.ReactNode
}

interface BlockTagsProps {
  tags: Tag[]
  onRemoveTag: (id: string) => void
}

export function BlockTags({ tags, onRemoveTag }: BlockTagsProps) {
  const getIcon = (label: string) => {
    if (label === "Messaging") return <MessageCircle className="size-3" />
    if (label === "Social Media") return <Users className="size-3" />
    return null
  }

  return (
    <div className="flex items-start gap-4">
      <label className="text-sm font-medium text-white w-20 shrink-0 pt-2">
        Block
      </label>
      <div className="flex-1">
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
      </div>
    </div>
  )
}

