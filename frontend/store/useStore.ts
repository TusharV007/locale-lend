import { create } from 'zustand';
import type { Item, User, ItemCategory, GeoJSONPoint } from '@/types';

interface AppState {
  // User location - GeoJSON format for compatibility with MongoDB geospatial queries
  userLocation: GeoJSONPoint | null;
  setUserLocation: (location: GeoJSONPoint | null) => void;
  
  // Current user
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // Nearby items from geospatial query
  nearbyItems: Item[];
  setNearbyItems: (items: Item[] | ((prev: Item[]) => Item[])) => void;
  
  // Selected item for detail view
  selectedItem: Item | null;
  setSelectedItem: (item: Item | null) => void;
  
  // Category filter
  selectedCategory: ItemCategory | null;
  setSelectedCategory: (category: ItemCategory | null) => void;
  
  // Search radius in meters (default 2km)
  searchRadius: number;
  setSearchRadius: (radius: number) => void;
  
  // Modal states
  isRequestModalOpen: boolean;
  setRequestModalOpen: (open: boolean) => void;
  
  // Global Loading Progress (Top Bar)
  globalLoading: boolean;
  globalProgress: number;
  setGlobalLoading: (loading: boolean) => void;
  setGlobalProgress: (progress: number) => void;

  // Public Profile View
  viewingUser: User | null;
  isPublicProfileOpen: boolean;
  setViewingUser: (user: User | null) => void;
  setPublicProfileOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
  
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  
  nearbyItems: [],
  setNearbyItems: (items) => set((state) => ({ 
    nearbyItems: typeof items === 'function' ? items(state.nearbyItems) : items 
  })),
  
  selectedItem: null,
  setSelectedItem: (item) => set({ selectedItem: item }),
  
  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  searchRadius: 2000, // 2km default
  setSearchRadius: (radius) => set({ searchRadius: radius }),
  
  isRequestModalOpen: false,
  setRequestModalOpen: (open) => set({ isRequestModalOpen: open }),
  
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  globalLoading: false,
  globalProgress: 0,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
  setGlobalProgress: (progress) => set({ globalProgress: progress }),

  viewingUser: null,
  isPublicProfileOpen: false,
  setViewingUser: (user) => set({ viewingUser: user }),
  setPublicProfileOpen: (open) => set({ isPublicProfileOpen: open }),
}));
