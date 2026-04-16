import { ItemCategory } from "@/types";

// Category configuration with colors and icons
export const categoryConfig: Record<ItemCategory, { color: string; bgColor: string; icon: string }> = {
  Tools: { color: 'text-category-tools', bgColor: 'bg-category-tools/10', icon: 'Wrench' },
  Electronics: { color: 'text-category-electronics', bgColor: 'bg-category-electronics/10', icon: 'Laptop' },
  Kitchen: { color: 'text-category-kitchen', bgColor: 'bg-category-kitchen/10', icon: 'ChefHat' },
  Outdoor: { color: 'text-category-outdoor', bgColor: 'bg-category-outdoor/10', icon: 'Tent' },
  Books: { color: 'text-category-books', bgColor: 'bg-category-books/10', icon: 'BookOpen' },
  Gaming: { color: 'text-category-gaming', bgColor: 'bg-category-gaming/10', icon: 'Gamepad2' },
  'Board Games': { color: 'text-category-boardgames', bgColor: 'bg-category-boardgames/10', icon: 'Dices' },
  Sports: { color: 'text-category-sports', bgColor: 'bg-category-sports/10', icon: 'Bike' },
  Construction: { color: 'text-category-construction', bgColor: 'bg-category-construction/10', icon: 'Hammer' },
};
