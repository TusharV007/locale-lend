"use client";

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ItemCard } from '@/components/ItemCard';
import { Grid3x3, List, SlidersHorizontal, Package, Search as SearchIcon, X } from 'lucide-react';
import { fetchItems } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import type { Item, ItemCategory, GeoJSONPoint } from '@/types';
import { DEFAULT_USER_LOCATION } from '@/data/mockData';
import { RequestModal } from '@/components/RequestModal';
import { AddItemModal } from '@/components/AddItemModal';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import { calculateDistance } from '@/lib/utils';
import { useLocation } from '@/hooks/useLocation';

function SearchPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userLocation, requestUserLocation } = useLocation();

    const query = searchParams.get('q') || '';
    const categoryParam = searchParams.get('category') as ItemCategory | null;

    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(categoryParam);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'distance' | 'newest' | 'popular'>('newest');
    const [searchQuery, setSearchQuery] = useState(query);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

    const {
        selectedItem,
        setSelectedItem,
        isRequestModalOpen,
        setRequestModalOpen,
    } = useStore();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth');
        } else if (user) {
            requestUserLocation(true); // Attempt to get location silently
        }
    }, [user, authLoading, router, requestUserLocation]);

    const fetchSearchResults = async () => {
        setLoading(true);
        try {
            const location = userLocation || DEFAULT_USER_LOCATION;
            const resultsWithDistance = result.items.map(item => {
                const itemWithDistance = { ...item, distance: 0 };
                if (location && item.location) {
                    itemWithDistance.distance = calculateDistance(location, item.location as GeoJSONPoint);
                }
                return itemWithDistance;
            });

            setItems(resultsWithDistance);
        } catch (error) {
            console.error('Failed to fetch search results:', error);
            toast.error('Failed to load search results');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchSearchResults();
        }
    }, [query, user, userLocation]);

    const handleSearch = (newQuery: string) => {
        if (!newQuery.trim()) return;
        router.push(`/search?q=${encodeURIComponent(newQuery)}`);
    };

    const handleCategoryChange = (category: ItemCategory | null) => {
        setSelectedCategory(category);
    };

    const handleRequestClick = (item: Item) => {
        setSelectedItem(item);
        setRequestModalOpen(true);
    };

    const handleRequestSubmit = async () => {
        toast.success('Request sent successfully!');
        setRequestModalOpen(false);
        setSelectedItem(null);
    };

    // Filter and sort items
    const filteredItems = items
        .filter(item => item.owner.id !== user?.uid)
        .filter(item => item.status === 'available' || !item.status)
        .filter(item => selectedCategory ? item.category === selectedCategory : true);

    const sortedItems = [...filteredItems].sort((a, b) => {
        const statusA = a.status || 'available';
        const statusB = b.status || 'available';
        if (statusA === 'available' && statusB !== 'available') return -1;
        if (statusA !== 'available' && statusB === 'available') return 1;

        if (sortBy === 'distance') {
            return (a.distance || 0) - (b.distance || 0);
        } else if (sortBy === 'newest') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortBy === 'popular') {
            return (b.borrowCount || 0) - (a.borrowCount || 0);
        }
        return 0;
    });

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar onAddItemClick={() => setIsAddItemModalOpen(true)} onSearch={handleSearch} />

            <main className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Search Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <SearchIcon className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold">
                            {query ? `Search Results for "${query}"` : 'Browse All Items'}
                        </h1>
                    </div>

                    {/* Mobile Search Bar */}
                    <div className="md:hidden mb-4">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                                placeholder="Search items..."
                                className="w-full bg-secondary/50 border-none rounded-full py-2 pl-10 pr-10 text-sm focus:ring-2 focus:ring-primary/20"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Category Filter */}
                <div className="mb-8">
                    <CategoryFilter
                        selectedCategory={selectedCategory}
                        onCategoryChange={handleCategoryChange}
                    />
                </div>

                {/* Results Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-xl p-4 mb-6">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                            {loading ? 'Searching...' : `${sortedItems.length} items found`}
                        </p>
                        {selectedCategory && (
                            <p className="text-xs text-muted-foreground">
                                in <span className="text-primary font-medium">{selectedCategory}</span>
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-xs">
                            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                            >
                                <option value="newest">Newest</option>
                                <option value="distance">Nearest</option>
                                <option value="popular">Popular</option>
                            </select>
                        </div>

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

                {/* Results Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : sortedItems.length > 0 ? (
                    <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
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
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 bg-card border rounded-xl"
                    >
                        <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                        <p className="text-muted-foreground mb-6">
                            Try different keywords or browse all categories
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Browse All Items
                        </button>
                    </motion.div>
                )}
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
                onSuccess={() => {
                    setIsAddItemModalOpen(false);
                    toast.success('Item listed successfully!');
                }}
            />
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <SearchPageContent />
        </Suspense>
    );
}
