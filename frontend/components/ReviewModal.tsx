import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from './RatingStars';
import { createReview } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { HistoryItem } from '@/lib/db';

interface ReviewModalProps {
  transaction: HistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  revieweeId: string;
}

export function ReviewModal({ transaction, isOpen, onClose, onSuccess, revieweeId }: ReviewModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!transaction) return null;

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await createReview({
        requestId: transaction.requestId,
        reviewerId: user.uid,
        reviewerName: user.displayName || 'Anonymous',
        revieweeId: revieweeId,
        itemId: transaction.itemId,
        itemTitle: transaction.itemTitle,
        rating,
        comment: comment.trim() || null,
      });

      toast.success('Review submitted successfully!');
      onSuccess();
      setRating(0);
      setComment('');
      onClose();
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-card rounded-2xl shadow-hover z-10 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Leave a Review</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  How was your experience with {transaction.otherPartyName} for "{transaction.itemTitle}"?
                </p>
                <div className="flex justify-center">
                  <RatingStars
                    rating={rating}
                    maxRating={5}
                    size={40}
                    interactive
                    onRatingChange={setRating}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Comments (Optional)</label>
                <Textarea
                  placeholder="Share details of your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={rating === 0 || isSubmitting}
                  variant="accent"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
