"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { AddItemModal } from '@/components/AddItemModal';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ItemCard } from '@/components/ItemCard';
import { Package, ArrowUpRight, ArrowDownLeft, IndianRupee, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Item } from '@/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import {
    fetchUserItems,
    updateItemStatus,
    deleteItem,
    fetchUserLendingHistory,
    fetchUserBorrowingHistory,
    type HistoryItem,
    type PaginatedUserItems,
} from '@/lib/db';
import { toast } from 'sonner';

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [listings, setListings] = useState<Item[]>([]);
    const [lendingHistory, setLendingHistory] = useState<HistoryItem[]>([]);
    const [borrowingHistory, setBorrowingHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

    // Pagination state for listings
    const [listingsLastDoc, setListingsLastDoc] = useState<any>(null);
    const [listingsHasMore, setListingsHasMore] = useState(false);
    const [loadingMoreListings, setLoadingMoreListings] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.push('/auth');
    }, [user, authLoading, router]);

    const loadListings = async (reset = false) => {
        if (!user) return;
        const lastDoc = reset ? null : listingsLastDoc;
        if (!reset) setLoadingMoreListings(true);

        const result: PaginatedUserItems = await fetchUserItems(user.uid, 9, lastDoc);

        if (reset) {
            setListings(result.items);
        } else {
            setListings(prev => [...prev, ...result.items]);
        }
        setListingsLastDoc(result.lastDoc);
        setListingsHasMore(result.hasMore);
        setLoadingMoreListings(false);
    };

    useEffect(() => {
        if (!user) return;
        const loadAll = async () => {
            setLoading(true);
            try {
                const [lendResult, borrowResult] = await Promise.all([
                    fetchUserLendingHistory(user.uid),
                    fetchUserBorrowingHistory(user.uid),
                ]);
                setLendingHistory(lendResult);
                setBorrowingHistory(borrowResult);
                await loadListings(true);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, [user]);

    const handleEditItem = (item: Item) => {
        setEditingItem(item);
        setIsAddItemModalOpen(true);
    };

    const handleModalClose = () => {
        setIsAddItemModalOpen(false);
        setEditingItem(null);
    };

    const handleModalSuccess = () => {
        handleModalClose();
        loadListings(true);
        toast.success(editingItem ? 'Item updated!' : 'Item listed successfully!');
    };

    const StatusIcon = ({ status }: { status: HistoryItem['status'] }) => {
        if (status === 'accepted') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        if (status === 'rejected') return <XCircle className="w-4 h-4 text-red-500" />;
        return <Clock className="w-4 h-4 text-yellow-500" />;
    };

    const HistoryCard = ({ item, role }: { item: HistoryItem; role: 'lender' | 'borrower' }) => (
        <div className="bg-card border rounded-xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
            {item.itemImage ? (
                <img src={item.itemImage} alt={item.itemTitle} className="w-16 h-16 object-cover rounded-lg shrink-0" />
            ) : (
                <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-muted-foreground" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{item.itemTitle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {role === 'lender' ? `Borrowed by: ` : `Lent by: `}
                    <span className="text-foreground font-medium">{item.otherPartyName}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {item.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-1">
                    <StatusIcon status={item.status} />
                    <Badge variant={item.status === 'accepted' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize text-xs">
                        {item.status}
                    </Badge>
                </div>
                {item.rentalPricePerDay !== undefined && item.rentalPricePerDay > 0 && (
                    <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <IndianRupee className="w-3 h-3" />
                        {item.rentalPricePerDay}/day
                    </div>
                )}
                {item.paymentStatus === 'paid' && (
                    <Badge variant="outline" className="text-green-600 border-green-300 text-xs">Paid</Badge>
                )}
            </div>
        </div>
    );

    const EmptyState = ({ message }: { message: string }) => (
        <div className="text-center py-12 text-muted-foreground bg-secondary/30 rounded-xl border border-dashed border-border">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{message}</p>
        </div>
    );

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar onAddItemClick={() => { setEditingItem(null); setIsAddItemModalOpen(true); }} />

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Profile Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                        {user.displayName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{user.displayName}</h1>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                <Tabs defaultValue="listings" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="listings">My Listings ({listings.length})</TabsTrigger>
                        <TabsTrigger value="lends">Lent Out ({lendingHistory.length})</TabsTrigger>
                        <TabsTrigger value="borrows">Borrowed ({borrowingHistory.length})</TabsTrigger>
                    </TabsList>

                    {/* My Listings */}
                    <TabsContent value="listings" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Package className="w-5 h-5" /> Items you are sharing
                            </h2>
                            <button
                                onClick={() => { setEditingItem(null); setIsAddItemModalOpen(true); }}
                                className="text-sm text-primary hover:underline font-medium"
                            >
                                + Add New
                            </button>
                        </div>

                        {listings.length > 0 ? (
                            <>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {listings.map((item, idx) => (
                                        <div key={item.id} className="relative group">
                                            <ItemCard item={item} index={idx} onRequestClick={() => { }} />
                                            <div className="absolute top-2 right-2 flex gap-1.5 bg-background/90 backdrop-blur-sm rounded-md shadow-sm border p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditItem(item)}
                                                    className="text-primary hover:text-primary/80 px-2 py-0.5 text-xs font-medium hover:bg-primary/10 rounded transition-colors"
                                                    title="Edit item"
                                                >
                                                    Edit
                                                </button>
                                                <select
                                                    className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
                                                    value={item.status || 'available'}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value as any;
                                                        try {
                                                            await updateItemStatus(item.id, newStatus);
                                                            setListings(prev => prev.map(l => l.id === item.id ? { ...l, status: newStatus } : l));
                                                            toast.success(`Status → ${newStatus}`);
                                                        } catch { toast.error('Failed to update status'); }
                                                    }}
                                                >
                                                    <option value="available">Available</option>
                                                    <option value="lended">Lended</option>
                                                    <option value="unavailable">Unavailable</option>
                                                </select>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setItemToDelete(item);
                                                    }}
                                                    className="text-red-600 hover:text-red-700 px-2 py-0.5 text-xs font-medium hover:bg-red-50 rounded transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {listingsHasMore && (
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => loadListings(false)}
                                            disabled={loadingMoreListings}
                                            className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {loadingMoreListings ? 'Loading...' : 'Load More'}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : <EmptyState message="You haven't listed any items yet." />}
                    </TabsContent>

                    {/* Lent Out History */}
                    <TabsContent value="lends" className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <ArrowUpRight className="w-5 h-5 text-green-500" /> Items you have lent out
                        </h2>
                        {lendingHistory.length > 0 ? (
                            <div className="space-y-3">
                                {lendingHistory.map(item => (
                                    <HistoryCard key={item.requestId} item={item} role="lender" />
                                ))}
                            </div>
                        ) : <EmptyState message="No lending history yet." />}
                    </TabsContent>

                    {/* Borrowed History */}
                    <TabsContent value="borrows" className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <ArrowDownLeft className="w-5 h-5 text-blue-500" /> Items you have borrowed
                        </h2>
                        {borrowingHistory.length > 0 ? (
                            <div className="space-y-3">
                                {borrowingHistory.map(item => (
                                    <HistoryCard key={item.requestId} item={item} role="borrower" />
                                ))}
                            </div>
                        ) : <EmptyState message="No borrowing history yet." />}
                    </TabsContent>
                </Tabs>
            </div>

            <AddItemModal
                isOpen={isAddItemModalOpen}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                editItem={editingItem}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={itemToDelete !== null} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{itemToDelete?.title}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (!itemToDelete || !user) return;
                                try {
                                    await deleteItem(itemToDelete.id, user.uid);
                                    setListings(prev => prev.filter(l => l.id !== itemToDelete.id));
                                    toast.success('Item deleted');
                                } catch {
                                    toast.error('Failed to delete item');
                                }
                            }}
                            className="bg-red-600 focus:ring-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Item
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
