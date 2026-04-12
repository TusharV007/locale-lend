import type { User, Item, ItemCategory, GeoJSONPoint } from '@/types';

// Mock user location (Visakhapatnam, Andhra Pradesh)
export const DEFAULT_USER_LOCATION: GeoJSONPoint = {
  type: 'Point' as const,
  coordinates: [83.2185, 17.6868], // [lng, lat]
};

// Mock users representing neighbors in the community
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    location: { type: 'Point' as const, coordinates: [80.4370, 16.3070] },
    address: '123 Main St',
    trustScore: 4.8,
    totalReviews: 23,
    itemsLentCount: 45,
    itemsBorrowedCount: 12,
    memberSince: new Date('2023-03-15'),
    verified: true,
  },
  {
    id: 'user-2',
    name: 'Marcus Johnson',
    email: 'marcus@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    location: { type: 'Point' as const, coordinates: [80.4360, 16.3065] },
    address: '456 Oak Ave',
    trustScore: 4.5,
    totalReviews: 18,
    itemsLentCount: 32,
    itemsBorrowedCount: 28,
    memberSince: new Date('2023-06-20'),
    verified: true,
  },
  {
    id: 'user-3',
    name: 'Emily Rodriguez',
    email: 'emily@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    location: { type: 'Point' as const, coordinates: [80.4375, 16.3075] },
    address: '789 Pine St',
    trustScore: 4.2,
    totalReviews: 9,
    itemsLentCount: 15,
    itemsBorrowedCount: 8,
    memberSince: new Date('2024-01-10'),
    verified: true,
  },
  {
    id: 'user-4',
    name: 'David Kim',
    email: 'david@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    location: { type: 'Point' as const, coordinates: [80.4355, 16.3060] },
    address: '321 Elm St',
    trustScore: 3.8,
    totalReviews: 5,
    itemsLentCount: 8,
    itemsBorrowedCount: 15,
    memberSince: new Date('2024-06-05'),
    verified: false,
  },
];

// Mock items available in the neighborhood
export const mockItems: Item[] = [
  {
    id: 'item-1',
    ownerId: 'user-1',
    owner: mockUsers[0],
    title: 'DeWalt Power Drill',
    description: 'Professional-grade cordless drill with two batteries. Perfect for home projects.',
    category: 'Tools',
    location: { type: 'Point' as const, coordinates: [80.4370, 16.3070] },
    images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400'],
    availabilityStatus: 'Available',
    distance: 150,
    createdAt: new Date('2024-08-15'),
    status: 'available',
    borrowCount: 12,
  },
  {
    id: 'item-2',
    ownerId: 'user-2',
    owner: mockUsers[1],
    title: 'KitchenAid Stand Mixer',
    description: 'Red 5-quart stand mixer. Great for baking - comes with all attachments.',
    category: 'Kitchen',
    location: { type: 'Point' as const, coordinates: [80.4360, 16.3065] },
    images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400'],
    availabilityStatus: 'Available',
    distance: 320,
    createdAt: new Date('2024-07-22'),
    status: 'available',
    borrowCount: 8,
  },
  {
    id: 'item-3',
    ownerId: 'user-3',
    owner: mockUsers[2],
    title: 'Camping Tent (4-Person)',
    description: 'Waterproof family tent, easy setup. Perfect for weekend adventures.',
    category: 'Outdoor',
    location: { type: 'Point' as const, coordinates: [80.4375, 16.3075] },
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400'],
    availabilityStatus: 'Available',
    distance: 280,
    createdAt: new Date('2024-09-01'),
    status: 'available',
    borrowCount: 5,
  },
  {
    id: 'item-4',
    ownerId: 'user-1',
    owner: mockUsers[0],
    title: 'Circular Saw',
    description: '7-1/4" circular saw with laser guide. Safety gear included.',
    category: 'Tools',
    location: { type: 'Point' as const, coordinates: [80.4370, 16.3070] },
    images: ['https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400'],
    availabilityStatus: 'Borrowed',
    distance: 150,
    createdAt: new Date('2024-06-10'),
    status: 'lended',
    borrowCount: 18,
  },
  {
    id: 'item-5',
    ownerId: 'user-4',
    owner: mockUsers[3],
    title: 'Sony Camera A7 III',
    description: 'Full-frame mirrorless camera with 28-70mm lens. Great for events!',
    category: 'Electronics',
    location: { type: 'Point' as const, coordinates: [80.4355, 16.3060] },
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400'],
    availabilityStatus: 'Available',
    distance: 450,
    createdAt: new Date('2024-05-18'),
    status: 'available',
    borrowCount: 22,
  },
  {
    id: 'item-6',
    ownerId: 'user-2',
    owner: mockUsers[1],
    title: 'Mountain Bike',
    description: '21-speed mountain bike, recently tuned. Helmet included.',
    category: 'Sports',
    location: { type: 'Point' as const, coordinates: [80.4360, 16.3065] },
    images: ['https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400'],
    availabilityStatus: 'Available',
    distance: 320,
    createdAt: new Date('2024-08-28'),
    status: 'available',
    borrowCount: 15,
  },
  {
    id: 'item-7',
    ownerId: 'user-3',
    owner: mockUsers[2],
    title: 'Board Games Collection',
    description: 'Settlers of Catan, Ticket to Ride, and Codenames. Perfect for game night!',
    category: 'Books',
    location: { type: 'Point' as const, coordinates: [80.4375, 16.3075] },
    images: ['https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=400'],
    availabilityStatus: 'Available',
    distance: 280,
    createdAt: new Date('2024-09-10'),
    status: 'available',
    borrowCount: 10,
  },
  {
    id: 'item-8',
    ownerId: 'user-4',
    owner: mockUsers[3],
    title: 'Projector & Screen',
    description: 'HD projector with 100" portable screen. Movie night essentials!',
    category: 'Electronics',
    location: { type: 'Point' as const, coordinates: [80.4355, 16.3060] },
    images: ['https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400'],
    availabilityStatus: 'Reserved',
    distance: 450,
    createdAt: new Date('2024-04-05'),
    status: 'available',
    borrowCount: 30,
  },
  {
    id: 'item-9',
    ownerId: 'user-2',
    owner: mockUsers[1],
    title: 'Concrete Mixer',
    description: 'Heavy duty concrete mixer. Perfect for small construction projects.',
    category: 'Construction',
    location: { type: 'Point' as const, coordinates: [80.4360, 16.3065] },
    images: ['https://images.unsplash.com/photo-1579483115913-74752182281b?w=400'],
    availabilityStatus: 'Available',
    distance: 320,
    createdAt: new Date('2024-10-01'),
    status: 'available',
    borrowCount: 2,
  },
  {
    id: 'item-10',
    ownerId: 'user-3',
    owner: mockUsers[2],
    title: 'Electric Lawn Mower',
    description: 'Cordless electric lawn mower, easy to use and very quiet.',
    category: 'Gardening',
    location: { type: 'Point' as const, coordinates: [80.4375, 16.3075] },
    images: ['https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=400'],
    availabilityStatus: 'Available',
    distance: 280,
    createdAt: new Date('2024-09-15'),
    status: 'available',
    borrowCount: 4,
  },
];

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

/**
 * Simulates the MongoDB $near geospatial query
 * In production, this would be an Express controller using:
 * 
 * Item.find({
 *   location: {
 *     $near: {
 *       $geometry: { type: 'Point', coordinates: [lng, lat] },
 *       $maxDistance: radius // in meters
 *     }
 *   }
 * })
 * 
 * The 2dsphere index on the location field enables efficient proximity searches
 */
export function fetchNearbyItems(
  lat: number,
  lng: number,
  radius: number = 2000,
  category?: ItemCategory
): Item[] {
  // Filter by category if specified
  let filteredItems = category
    ? mockItems.filter(item => item.category === category)
    : mockItems;

  // Filter by distance (simulating $maxDistance constraint)
  filteredItems = filteredItems.filter(item => (item.distance || 0) <= radius);

  // Sort by distance (simulating $near ordering - closest first)
  return filteredItems.sort((a, b) => (a.distance || 0) - (b.distance || 0));
}
