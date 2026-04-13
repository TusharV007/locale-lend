import { ItemCategory } from "@/types";

// Category configuration with colors and icons
export const categoryConfig: Record<ItemCategory, { color: string; bgColor: string; icon: string }> = {
  Tools: { color: 'text-category-tools', bgColor: 'bg-category-tools/10', icon: 'Wrench' },
  Electronics: { color: 'text-category-electronics', bgColor: 'bg-category-electronics/10', icon: 'Laptop' },
  Kitchen: { color: 'text-category-kitchen', bgColor: 'bg-category-kitchen/10', icon: 'ChefHat' },
  Outdoor: { color: 'text-category-outdoor', bgColor: 'bg-category-outdoor/10', icon: 'Tent' },
  Books: { color: 'text-category-books', bgColor: 'bg-category-books/10', icon: 'BookOpen' },
  Sports: { color: 'text-category-sports', bgColor: 'bg-category-sports/10', icon: 'Bike' },
  Construction: { color: 'text-category-construction', bgColor: 'bg-category-construction/10', icon: 'Hammer' },
  Gardening: { color: 'text-category-gardening', bgColor: 'bg-category-gardening/10', icon: 'Sprout' },
  Party: { color: 'text-category-party', bgColor: 'bg-category-party/10', icon: 'PartyPopper' },
  Toys: { color: 'text-category-toys', bgColor: 'bg-category-toys/10', icon: 'Gamepad2' },
  Clothing: { color: 'text-category-clothing', bgColor: 'bg-category-clothing/10', icon: 'Shirt' },
  Musical: { color: 'text-category-musical', bgColor: 'bg-category-musical/10', icon: 'Music' },
  Health: { color: 'text-category-health', bgColor: 'bg-category-health/10', icon: 'Dumbbell' },
  Home: { color: 'text-category-home', bgColor: 'bg-category-home/10', icon: 'Home' },
};
