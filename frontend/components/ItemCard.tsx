'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Clock, User, Navigation } from 'lucide-react';
import type { Item } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const ItemLocationMap = dynamic(() => import('./ItemLocationMap'), { ssr: false });

interface ItemCardProps {
  item: Item;
  onRequestClick: (item: Item) => void;
  index?: number;
}

export function ItemCard({ item, onRequestClick, index = 0 }: ItemCardProps) {
  const [showLocationMap, setShowLocationMap] = useState(false);

  const statusColors: Record<string, string> = {
    available: 'bg-green-500/10 text-green-600 border-green-500/20',
    lended: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    unavailable: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return 'Nearby';
    if (meters < 1000) return `${meters}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ y: -4 }}
        className="group relative bg-card rounded-xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 flex flex-col h-full"
      >
        {/* Image */}
        <div className="relative w-full aspect-[4/3] shrink-0 overflow-hidden">
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover bg-muted/30 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />

          {/* Status badge */}
          <Badge
            variant="outline"
            className={cn(
              'absolute top-3 right-3 backdrop-blur-sm border',
              statusColors[item.status || 'available']
            )}
          >
            {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Available'}
          </Badge>

          {/* Distance badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm text-xs font-medium">
            <MapPin className="w-3 h-3 text-primary" />
            {formatDistance(item.distance)}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <div className="mb-4">
            <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {item.description}
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            {/* Owner info */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2 overflow-hidden">
                {item.owner.avatar && item.owner.avatar !== 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' ? (
                  <img
                    src={item.owner.avatar}
                    alt={item.owner.name}
                    className="w-8 h-8 shrink-0 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-8 h-8 shrink-0 rounded-full bg-secondary text-primary font-semibold flex flex-col pt-[1px] items-center justify-center">
                    <span>{item.owner.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-card-foreground truncate">
                    {item.owner.name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="w-3 h-3 text-accent fill-accent" />
                    <span className="text-xs text-muted-foreground">
                      {item.owner.trustScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="w-3 h-3" />
                {item.borrowCount} borrows
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 px-2 whitespace-normal h-auto min-h-[36px]"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLocationMap(true);
                }}
              >
                <Navigation className="w-4 h-4 mr-1 shrink-0" />
                <span>View Map</span>
              </Button>

              {(item.status === 'available' || !item.status) && (
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 px-2 whitespace-normal h-auto min-h-[36px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestClick(item);
                  }}
                >
                  {(item as any).rentalPricePerDay > 0 ? `₹${(item as any).rentalPricePerDay}/day` : 'Request'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Location Map Modal */}
      {showLocationMap && item.location && (
        <ItemLocationMap
          isOpen={showLocationMap}
          onClose={() => setShowLocationMap(false)}
          itemLocation={item.location}
          itemTitle={item.title}
          ownerName={item.owner.name}
          ownerAvatar={item.owner.avatar}
          distance={formatDistance(item.distance)}
        />
      )}
    </>
  );
}
