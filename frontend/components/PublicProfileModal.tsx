import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Star, Award, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewList } from '@/components/ReviewList';
import { fetchUserReviews } from '@/lib/db';
import type { User, Review } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface PublicProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PublicProfileModal({ user, isOpen, onClose }: PublicProfileModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setIsLoading(true);
      fetchUserReviews(user.id)
        .then(setReviews)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [user, isOpen]);

  if (!user) return null;

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
            className="relative w-full max-w-2xl bg-card rounded-2xl shadow-hover z-10 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Cover */}
            <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-background/50 hover:bg-background transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 -mt-12">
              <div className="bg-card rounded-full w-24 h-24 p-1 shadow-md mb-4 inline-block">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {user.name}
                    {user.verified && <Shield className="w-5 h-5 text-primary" title="Verified Member" />}
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4" /> Member since {user.memberSince instanceof Date ? user.memberSince.toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="bg-accent/10 px-4 py-2 rounded-xl text-center">
                  <div className="text-2xl font-bold text-accent flex items-center gap-1 justify-center">
                    <Star className="fill-accent w-5 h-5" />
                    {user.trustScore ? user.trustScore.toFixed(1) : '3.0'}
                  </div>
                  <div className="text-xs font-medium text-accent/80 uppercase tracking-wider">
                    Trust Score
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pb-6 border-b">
                <div className="bg-secondary/50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-semibold">{user.totalReviews || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Reviews</div>
                </div>
                <div className="bg-secondary/50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-semibold">{user.itemsLentCount || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Items Lent</div>
                </div>
                <div className="bg-secondary/50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-semibold">{user.itemsBorrowedCount || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Borrowed</div>
                </div>
                <div className="bg-secondary/50 p-4 rounded-xl text-center flex flex-col items-center justify-center">
                   <Award className="w-8 h-8 text-primary mb-1" />
                   <div className="text-xs text-muted-foreground">Level</div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">Reviews & Feedback</h3>
                {isLoading ? (
                  <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <ReviewList reviews={reviews} emptyMessage="This user hasn't received any reviews yet." />
                )}
              </div>
            </div>
            
            <div className="p-4 border-t bg-card text-center">
                <Button variant="outline" className="w-full sm:w-auto" onClick={onClose}>Close Profile</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
