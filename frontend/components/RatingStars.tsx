import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingStarsProps {
  rating: number
  maxRating?: number
  size?: number
  className?: string
  interactive?: boolean
  onRatingChange?: (rating: number) => void
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = 20,
  className,
  interactive = false,
  onRatingChange,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null)

  const displayRating = hoverRating !== null ? hoverRating : rating

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const value = i + 1
        return (
          <button
            key={i}
            type={interactive ? "button" : undefined}
            className={cn(
              "relative transition-colors",
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            )}
            onMouseEnter={() => interactive && setHoverRating(value)}
            onMouseLeave={() => interactive && setHoverRating(null)}
            onClick={() => interactive && onRatingChange?.(value)}
            disabled={!interactive}
          >
            <Star
              size={size}
              className={cn(
                "transition-colors",
                value <= displayRating
                  ? "fill-accent text-accent"
                  : "fill-muted text-muted"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
