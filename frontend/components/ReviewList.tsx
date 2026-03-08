import { formatDistanceToNow } from 'date-fns';
import { RatingStars } from './RatingStars';
import { Review } from '@/types';

interface ReviewListProps {
  reviews: Review[];
  emptyMessage?: string;
}

export function ReviewList({ reviews, emptyMessage = "No reviews yet." }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground bg-secondary/30 rounded-xl border border-dashed text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="p-4 rounded-xl border bg-card/50 hover:bg-card transition-colors">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-semibold text-sm">{review.reviewerName}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Item: {review.itemTitle}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <RatingStars rating={review.rating} size={14} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {formatDistanceToNow(review.createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>
          {review.comment && (
            <p className="text-sm text-foreground/90 mt-3 bg-secondary/30 p-3 rounded-lg border border-border/50">
              "{review.comment}"
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
