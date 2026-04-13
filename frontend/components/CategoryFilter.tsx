import { motion } from 'framer-motion';
import { Wrench, Laptop, ChefHat, Tent, BookOpen, Bike, Hammer, Sprout, PartyPopper, Gamepad2, Shirt, Music, Dumbbell, Home } from 'lucide-react';
import { categoryConfig } from '@/lib/constants';
import type { ItemCategory } from '@/types';
import { cn } from '@/lib/utils';

const categories: { id: ItemCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'Tools', label: 'Tools', icon: Wrench },
  { id: 'Electronics', label: 'Electronics', icon: Laptop },
  { id: 'Kitchen', label: 'Kitchen', icon: ChefHat },
  { id: 'Outdoor', label: 'Outdoor', icon: Tent },
  { id: 'Books', label: 'Books & Games', icon: BookOpen },
  { id: 'Sports', label: 'Sports', icon: Bike },
  { id: 'Construction', label: 'Construction', icon: Hammer },
  { id: 'Gardening', label: 'Gardening', icon: Sprout },
  { id: 'Party', label: 'Party & Events', icon: PartyPopper },
  { id: 'Toys', label: 'Toys & Kids', icon: Gamepad2 },
  { id: 'Clothing', label: 'Clothing', icon: Shirt },
  { id: 'Musical', label: 'Musical Instruments', icon: Music },
  { id: 'Health', label: 'Health & Fitness', icon: Dumbbell },
  { id: 'Home', label: 'Home Decor', icon: Home },
];

interface CategoryFilterProps {
  selectedCategory: ItemCategory | null;
  onCategoryChange: (category: ItemCategory | null) => void;
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onCategoryChange(null)}
        className={cn(
          'category-pill border-2',
          selectedCategory === null
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-card text-card-foreground hover:border-primary/50'
        )}
      >
        All Items
      </motion.button>

      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;

        return (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCategoryChange(isSelected ? null : category.id)}
            className={cn(
              'category-pill border-2',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-card-foreground hover:border-primary/50'
            )}
          >
            <Icon className="w-4 h-4" />
            {category.label}
          </motion.button>
        );
      })}
    </div>
  );
}
