import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MessageSquare, Star, Shield, MapPin, Minus, Plus } from 'lucide-react';
import type { Item } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createRequest } from '@/lib/db';
import { cn } from '@/lib/utils';

import { useAuth } from '@/contexts/AuthContext';

interface RequestModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
}

export function RequestModal({ item, isOpen, onClose, onSubmit }: RequestModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState(1);
  const [priceUnit, setPriceUnit] = useState<'hour' | 'day'>('day');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sync state when modal opens or item changes
  useEffect(() => {
    if (isOpen && item) {
      setDuration(1);
      setPriceUnit(item.priceUnit || 'day');
      setMessage('');
    }
  }, [isOpen, item]);

  if (!item) return null;

  // Calculate rate based on conversion
  const getRate = () => {
    if (!item) return 0;
    if (priceUnit === item.priceUnit) return item.rentalPrice;
    // Conversion: 1 Day = 24 Hours
    if (priceUnit === 'day' && item.priceUnit === 'hour') return item.rentalPrice * 24;
    if (priceUnit === 'hour' && item.priceUnit === 'day') return item.rentalPrice / 24;
    return item.rentalPrice;
  };

  const currentRate = getRate();
  const totalPrice = currentRate * duration;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const requestData: any = {
        itemId: item.id,
        itemTitle: item.title,
        borrowerId: user?.uid || 'anonymous',
        borrowerName: user?.displayName || 'Anonymous',
        lenderId: item.owner.id,
        lenderName: item.owner.name,
        message: message,
        duration: duration,
        priceUnit: priceUnit,
        selectedPrice: currentRate
      };

      await createRequest(requestData);

      onSubmit(message);
      setMessage('');
      setDuration(1);
      onClose();
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-card rounded-2xl shadow-hover z-10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with image */}
            <div className="relative h-48">
              <img
                src={item.images[0]}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-background/20 backdrop-blur-sm text-primary-foreground hover:bg-background/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Item info overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl font-bold text-primary-foreground">{item.title}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-primary-foreground/80 text-sm">
                    <MapPin className="w-4 h-4" />
                    {item.distance ? `${item.distance}m away` : 'Nearby'}
                  </div>
                  <div className="flex items-center gap-1.5 text-primary-foreground/80 text-sm">
                    <Calendar className="w-4 h-4" />
                    Available now
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Owner card */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary">
                {item.owner.avatar && !imageError ? (
                  <img
                    src={item.owner.avatar}
                    alt={item.owner.name}
                    onError={() => setImageError(true)}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-background/50 text-primary font-bold flex items-center justify-center text-xl border-2 border-primary/20">
                    {item.owner.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-card-foreground">{item.owner.name}</span>
                    {item.owner.verified && (
                      <Shield className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="text-sm font-medium">{item.owner.trustScore.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.owner.itemsLentCount} items shared
                    </span>
                  </div>
                </div>
              </div>

              {/* Rental Duration input */}
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Rental Rate
                    </label>
                    <div className="flex bg-secondary p-1 rounded-lg border border-border">
                        <button
                          type="button"
                          onClick={() => {
                            setPriceUnit('hour');
                            setDuration(1);
                          }}
                          className={cn(
                            "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                            priceUnit === 'hour' ? "bg-background text-primary shadow-sm" : "hover:bg-background/50 text-muted-foreground"
                          )}
                        >
                          Hourly
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPriceUnit('day');
                            setDuration(1);
                          }}
                          className={cn(
                            "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                            priceUnit === 'day' ? "bg-background text-primary shadow-sm" : "hover:bg-background/50 text-muted-foreground"
                          )}
                        >
                          Daily
                        </button>
                    </div>
                  </div>
                  <div className="bg-secondary p-3 rounded-xl border border-secondary flex justify-between items-center">
                    <div className="text-sm font-bold text-foreground">
                      ₹{currentRate.toFixed(2)} per {priceUnit}
                    </div>
                    {priceUnit !== item.priceUnit && (
                        <span className="text-[10px] text-muted-foreground italic">
                            (Converted from {item.priceUnit}ly rate)
                        </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex flex-col text-sm font-medium text-card-foreground">
                    <span>Duration ({priceUnit === 'day' ? 'Days' : 'Hours'})</span>
                    <span className="text-xs font-bold text-primary mt-0.5">
                      Total: ₹{totalPrice.toFixed(2)}
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setDuration(Math.max(1, duration - 1))}
                      disabled={duration <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="w-24 text-center font-medium text-lg">
                      {duration} {priceUnit === 'day' ? (duration === 1 ? 'day' : 'days') : (duration === 1 ? 'hour' : 'hours')}
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setDuration(Math.min(priceUnit === 'day' ? 30 : 48, duration + 1))}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Message input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                  <MessageSquare className="w-4 h-4" />
                  Send a message (optional)
                </label>
                <Textarea
                  placeholder="Hi! I'd love to borrow this for my weekend project. When would be a good time to pick it up?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Sending...' : 'Send Request'}
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
