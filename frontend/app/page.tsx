"use client";

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ItemCard } from '@/components/ItemCard';
import { Grid3x3, List, SlidersHorizontal, Package } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

const NeighborhoodMap = dynamic(() => import('@/components/NeighborhoodMap').then(mod => mod.NeighborhoodMap), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-secondary animate-pulse rounded-2xl" />,
});
import { RequestModal } from '@/components/RequestModal';
import { LocationRequiredModal } from '@/components/LocationRequiredModal';
import { useStore } from '@/store/useStore';
import { mockUsers, DEFAULT_USER_LOCATION } from '@/data/mockData';
import { fetchItems } from '@/lib/db';
import type { Item, ItemCategory } from '@/types';

import { AddItemModal } from '@/components/AddItemModal';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LandingPage from '@/app/landing/page';

const RADIUS_LIMIT_METERS = 5000; // 5km

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'distance' | 'newest' | 'popular'>('distance');

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [mapItems, setMapItems] = useState<Item[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const {
    userLocation, setUserLocation,
    nearbyItems, setNearbyItems,
    selectedCategory, setSelectedCategory,
    selectedItem, setSelectedItem,
    isRequestModalOpen, setRequestModalOpen,
    setCurrentUser
  } = useStore();

  const fetchItemsData = async (
    location = userLocation || DEFAULT_USER_LOCATION,
    reset = true,
    query = ''
  ) => {
    try {
      setLoadingMore(true);
      const lastDoc = reset ? null : lastDocRef.current;
      const result = await fetchItems(12, query, lastDoc);

      const realItemsWithDistance = result.items.map(item => {
        if (!location || !item.location) return { ...item, distance: 0 };
        
        const itemLocation = item.location as any;
        const targetCoords = itemLocation.coordinates || (itemLocation.lng !== undefined && itemLocation.lat !== undefined ? [itemLocation.lng, itemLocation.lat] : null);
        if (!targetCoords || targetCoords.length < 2 || targetCoords[1] === undefined) return { ...item, distance: 0 };

        const R = 6371e3;
        const lat1 = location.coordinates[1] * Math.PI / 180;
        const lat2 = targetCoords[1] * Math.PI / 180;
        const dLat = (targetCoords[1] - location.coordinates[1]) * Math.PI / 180;
        const dLon = (targetCoords[0] - location.coordinates[0]) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        const dist = Math.floor(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
        return { ...item, distance: dist };
      });

      if (reset) {
        setNearbyItems(realItemsWithDistance);
      } else {
        setNearbyItems([...nearbyItems, ...realItemsWithDistance]);
      }

      lastDocRef.current = result.lastDoc;
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      if (reset) setNearbyItems([]);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    fetchItemsData(userLocation || DEFAULT_USER_LOCATION, false, searchQuery);
  };


  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos = { type: 'Point' as const, coordinates: [longitude, latitude] as [number, number] };
          setUserLocation(userPos);
          setShowLocationModal(false);
          toast.success("Location found!", { description: "Showing items near you." });
          fetchItemsData(userPos, true);
        },
        (error) => {
          console.error("Location access denied or error:", error);
          if (error.code === error.PERMISSION_DENIED) {
             toast.error("Location access requires browser permission", { description: "Please click the lock icon in your address bar to allow Location, then try again." });
          }
          setShowLocationModal(true);
        }
      );
    } else {
      toast.error("Geolocation not supported by your browser");
      setShowLocationModal(true);
    }
  };

  // Initialize with data and location
  useEffect(() => {
    if (!user) return;
    setCurrentUser(mockUsers[0]);

    // Fetch map items (all items for map view)
    const fetchMapItemsData = async () => {
      try {
        const result = await fetchItems(100);
        const location = userLocation || DEFAULT_USER_LOCATION;
        
        const filteredMapItems = result.items.map(item => {
          if (!location || !item.location) return { ...item, distance: 0 };
          
          const itemLocation = item.location as any;
          const targetCoords = itemLocation.coordinates || (itemLocation.lng !== undefined && itemLocation.lat !== undefined ? [itemLocation.lng, itemLocation.lat] : null);
          if (!targetCoords || targetCoords.length < 2) return { ...item, distance: 0 };

          const R = 6371e3;
          const lat1 = location.coordinates[1] * Math.PI / 180;
          const lat2 = targetCoords[1] * Math.PI / 180;
          const dLat = (targetCoords[1] - location.coordinates[1]) * Math.PI / 180;
          const dLon = (targetCoords[0] - location.coordinates[0]) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
          const dist = Math.floor(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
          return { ...item, distance: dist };
        }).filter(item => (item.distance || 0) <= RADIUS_LIMIT_METERS);

        setMapItems(filteredMapItems);
      } catch (error) {
        console.error('Failed to fetch map items:', error);
      }
    };
    fetchMapItemsData();

    // Request Location
    requestUserLocation();
  }, [user, selectedCategory]);

  // Handle search with debounce
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      fetchItemsData(userLocation || DEFAULT_USER_LOCATION, true, searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleExploreClick = () => {
    const mapSection = document.getElementById('map-section');
    mapSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
  };

  const handleRequestClick = (item: Item) => {
    setSelectedItem(item);
    setRequestModalOpen(true);
  };

  const handleRequestSubmit = (message: string) => {
    toast.success('Request sent!', {
      description: `Your request for "${selectedItem?.title}" has been sent to ${selectedItem?.owner.name}.`,
    });
    setRequestModalOpen(false);
    setSelectedItem(null);
  };

  const handleCategoryChange = (category: ItemCategory | null) => {
    setSelectedCategory(category);
  };

  const handleAddItemSuccess = () => {
    fetchItemsData(userLocation || DEFAULT_USER_LOCATION, true);
  };

  // Sort and filter items for display (exluding user's own items and unavailable items)
  const sortedItems = [...nearbyItems]
    .filter(item => item.owner.id !== user?.uid)
    .filter(item => item.status === 'available' || !item.status)
    .filter(item => (item.distance || 0) <= RADIUS_LIMIT_METERS)
    .sort((a, b) => {
    // Priority 1: Available items first
    const statusA = a.status || 'available';
    const statusB = b.status || 'available';
    if (statusA === 'available' && statusB !== 'available') return -1;
    if (statusA !== 'available' && statusB === 'available') return 1;

    // Priority 2: Sort by selected criteria
    if (sortBy === 'distance') {
      return (a.distance || 0) - (b.distance || 0);
    } else if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'popular') {
      return (b.borrowCount || 0) - (a.borrowCount || 0);
    }
    return 0;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">Loading LocalShare...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onAddItemClick={() => setIsAddItemModalOpen(true)} onSearch={handleSearch} />

      {/* Hero Section */}
      <HeroSection onExploreClick={handleExploreClick} />

      {/* Main Content */}
      <main id="map-section" className="container mx-auto px-4 py-12 space-y-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-3xl font-bold text-foreground">
            Items Near You
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Browse items available for borrowing in your neighborhood. Click on map markers
            or cards to learn more and send a borrow request.
          </p>
        </motion.div>

        <div className="mb-8">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
        </div>

        {/* Map and Items Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Map */}
          {userLocation && (
            <div className="lg:sticky lg:top-24 h-fit">
              <NeighborhoodMap
                userLocation={userLocation}
                userAvatar={user.photoURL || undefined}
                userName={user.displayName || 'User'}
                items={mapItems}
                onItemSelect={handleItemSelect}
                onRequestClick={handleRequestClick}
              />
            </div>
          )}

          {/* Items Grid */}
          <div className="space-y-6">
            {/* Results Header with Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-xl p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {searchQuery ? (
                    <>
                      Search results for <span className="text-primary font-semibold">"{searchQuery}"</span>
                    </>
                  ) : (
                    <>Items Near You</>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{sortedItems.length}</span> items found
                  {selectedCategory && (
                    <> in <span className="text-primary font-medium">{selectedCategory}</span></>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 text-xs">
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  >
                    <option value="distance">Nearest</option>
                    <option value="newest">Newest</option>
                    <option value="popular">Popular</option>
                  </select>
                </div>

                {/* View Toggle */}
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    title="Grid view"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    title="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Items Display */}
            <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 gap-4' : 'space-y-4'}>
              {sortedItems.map((item, index) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  currentUserId={user?.uid}
                  onRequestClick={handleRequestClick}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More Items'}
                </button>
              </div>
            )}

            {nearbyItems.length === 0 && !loadingMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 bg-card border rounded-xl"
              >
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery ? 'No items found' : 'No items available'}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchQuery ? (
                    <>Try adjusting your filters or search for something different.</>
                  ) : selectedCategory ? (
                    <>No items in this category right now. Check back later or browse all items.</>
                  ) : (
                    <>Be the first to list an item in your neighborhood!</>
                  )}
                </p>
                {(searchQuery || selectedCategory) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Request Modal */}
      <RequestModal
        item={selectedItem}
        isOpen={isRequestModalOpen}
        onClose={() => {
          setRequestModalOpen(false);
          setSelectedItem(null);
        }}
        onSubmit={handleRequestSubmit}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onSuccess={handleAddItemSuccess}
      />
      
      {/* Location Required Modal */}
      <LocationRequiredModal
        isOpen={showLocationModal}
        onRetry={requestUserLocation}
      />
    </div>
  );
};
