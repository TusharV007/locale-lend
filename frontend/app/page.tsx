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
import { calculateDistance } from '@/lib/utils';
import { useLocation } from '@/hooks/useLocation';

import { AddItemModal } from '@/components/AddItemModal';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LandingPage from '@/app/landing/page';
import { PublicProfileModal } from '@/components/PublicProfileModal';

const RADIUS_LIMIT_METERS = 15000; // 15km

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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
    setCurrentUser,
    viewingUser, isPublicProfileOpen, setPublicProfileOpen
  } = useStore();

  const { userLocation: actualLocation, requestUserLocation } = useLocation();

  const fetchItemsData = async (
    location: GeoJSONPoint | null = userLocation,
    reset = true
  ) => {
    try {
      setLoadingMore(true);
      const { fetchItems } = await import('@/lib/db');
      const lastDoc = reset ? null : lastDocRef.current;
      const result = await fetchItems(12, '', lastDoc);

      const realItemsWithDistance = result.items.map(item => {
        const itemWithDistance = { ...item, distance: 0 };
        if (location && item.location) {
          itemWithDistance.distance = calculateDistance(location, item.location as GeoJSONPoint);
        }
        return itemWithDistance;
      });

      if (reset) {
        setNearbyItems(realItemsWithDistance);
      } else {
        setNearbyItems(prev => [...prev, ...realItemsWithDistance]);
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
    fetchItemsData(userLocation, false);
  };


  const handleRequestLocation = () => {
    requestUserLocation();
    setShowLocationModal(false);
  };

  // Initialize with real-time data and location
  useEffect(() => {
    if (!user) return;
    
    let itemsUnsubscribe: (() => void) | null = null;

    // Fetch map items (all items for map view) with real-time subscription
    const setupItemsSubscription = async () => {
      try {
        const { subscribeNearbyItems } = await import('@/lib/db');
        
        itemsUnsubscribe = subscribeNearbyItems(100, (items) => {
           const location = userLocation;
        
           const filteredMapItems = items
             .map(item => {
               const itemWithDistance = { ...item, distance: 0 };
               if (location && item.location) {
                 itemWithDistance.distance = calculateDistance(location, item.location as GeoJSONPoint);
               }
               return itemWithDistance;
             })
             .filter(item => {
               const isNearby = (item.distance || 0) <= RADIUS_LIMIT_METERS;
               const isAvailable = item.status === 'available' || !item.status;
               const matchesCategory = !selectedCategory || item.category === selectedCategory;
               
               if (sortBy === 'distance') {
                 return isNearby && isAvailable && matchesCategory;
               }
               return isAvailable && matchesCategory;
             });

           setMapItems(filteredMapItems);
        });
      } catch (error) {
        console.error('Failed to setup items subscription:', error);
      }
    };
    setupItemsSubscription();

    // Request Location
    requestUserLocation(true); // Silent request

    return () => {
        if (itemsUnsubscribe) itemsUnsubscribe();
    }
  }, [user, selectedCategory, requestUserLocation, userLocation, sortBy]);

  useEffect(() => {
    if (!user) return;
    fetchItemsData(userLocation, true);
  }, [user, selectedCategory, userLocation]);

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
    fetchItemsData(userLocation, true);
    // Map items will refresh automatically via subscription
  };

  // Sort and filter items for display (exluding unavailable items)
  const sortedItems = [...nearbyItems]
    .filter(item => item.status === 'available' || !item.status)
    .filter(item => {
      if (sortBy === 'distance') {
        return (item.distance || 0) <= RADIUS_LIMIT_METERS;
      }
      return true;
    })
    .filter(item => !selectedCategory || item.category === selectedCategory)
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
      <Navbar onAddItemClick={() => setIsAddItemModalOpen(true)} />

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
                userLocation={userLocation || { type: 'Point', coordinates: [80.4365, 16.3067] }}
                userAvatar={user?.photoURL || ''}
                userName={user?.displayName || ''}
                items={mapItems}
                onItemSelect={handleItemSelect}
                onRequestClick={handleRequestClick}
                onViewProfile={(user) => {
                  setViewingUser(user);
                  setPublicProfileOpen(true);
                }}
              />
            </div>
          )}

          {/* Items Grid */}
          <div className="space-y-6">
            {/* Results Header with Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-xl p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Items Near You
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
                    <option value="newest">All</option>
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
                  No items available
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {selectedCategory ? (
                    <>No items in this category right now. Check back later or browse all items.</>
                  ) : (
                    <>Be the first to list an item in your neighborhood!</>
                  )}
                </p>
                {selectedCategory && (
                  <button
                    onClick={() => {
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
        onRetry={handleRequestLocation}
      />

      <PublicProfileModal
        user={viewingUser}
        isOpen={isPublicProfileOpen}
        onClose={() => setPublicProfileOpen(false)}
      />
    </div>
  );
};
