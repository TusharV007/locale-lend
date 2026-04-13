"use client";

import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { AddItemModal } from '@/components/AddItemModal';
import { ReviewModal } from '@/components/ReviewModal';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ItemCard } from '@/components/ItemCard';
import { Package, ArrowUpRight, ArrowDownLeft, IndianRupee, CheckCircle2, Clock, XCircle, Star, Gift, History } from 'lucide-react';
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
import { useRouter, useSearchParams } from 'next/navigation';
import {
    fetchUserItems,
    updateItemStatus,
    deleteItem,
    fetchUserLendingHistory,
    fetchUserBorrowingHistory,
    checkReviewExists,
    updateRequestStatus,
    type HistoryItem,
    type PaginatedUserItems,
} from '@/lib/db';
import { toast } from 'sonner';
import { ReferralCard } from '@/components/ReferralCard';
import { User as DBUser } from '@/types';
import { fetchUserProfile, fetchReferralPointsHistory } from '@/lib/db';
import { useAsyncAction } from '@/hooks/useAsyncAction';

function ProfilePageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [listings, setListings] = useState<Item[]>([]);
    const [lendingHistory, setLendingHistory] = useState<HistoryItem[]>([]);
    const [borrowingHistory, setBorrowingHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
    const [fullProfile, setFullProfile] = useState<DBUser | null>(null);
    
    // Review Modal State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewTransaction, setReviewTransaction] = useState<HistoryItem | null>(null);
    const [revieweeId, setRevieweeId] = useState<string>('');
    const [reviewedTransactions, setReviewedTransactions] = useState<Set<string>>(new Set());
    const { performAction } = useAsyncAction();

    // Pagination state for listings
    const [listingsLastDoc, setListingsLastDoc] = useState<any>(null);
    const [listingsHasMore, setListingsHasMore] = useState(false);
    const [loadingMoreListings, setLoadingMoreListings] = useState(false);

    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') || 'listings';

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
                
                // Check which completed transactions are already reviewed by this user
                const reviewedSet = new Set<string>();
                await Promise.all(
                    [...lendResult, ...borrowResult]
                        .filter(tx => tx.status === 'completed')
                        .map(async (tx) => {
                            const exists = await checkReviewExists(tx.requestId, user.uid);
                            if (exists) reviewedSet.add(tx.requestId);
                        })
                );
                setReviewedTransactions(reviewedSet);
                
                // Fetch full profile for referral stats
                const profile = await fetchUserProfile(user.uid);
                setFullProfile(profile);
 
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
        if (status === 'accepted' || status === 'completed') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        if (status === 'rejected') return <XCircle className="w-4 h-4 text-red-500" />;
        return <Clock className="w-4 h-4 text-yellow-500" />;
    };

    const handleCompleteRequest = async (requestId: string) => {
        await performAction(
            () => updateRequestStatus(requestId, 'completed'),
            {
                successMessage: 'Transaction marked as completed!',
                onSuccess: () => {
                    setLendingHistory(prev => prev.map(item => item.requestId === requestId ? { ...item, status: 'completed' } : item));
                    setBorrowingHistory(prev => prev.map(item => item.requestId === requestId ? { ...item, status: 'completed' } : item));
                }
            }
        );
    };

    const HistoryCard = ({ item, role }: { item: HistoryItem; role: 'lender' | 'borrower' }) => {
        // Need to determine the reviewee ID. 
        // If I am the lender, the reviewee is the borrower. The `HistoryItem` currently lacks the raw ID of the other party directly.
        // Wait, HistoryCard doesn't have the other party's ID cleanly exposed without a fetch.
        // Let's assume we handle it by fetching or using `message`? The DB functions check requests but let's see.
        // Actually, we can fetch the request document if needed, or pass it. 
        // For simplicity, we can initiate the review and lookup the IDs if missing.

        return (
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
                    <Badge variant={item.status === 'accepted' || item.status === 'completed' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize text-xs">
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
                
                {/* Actions */}
                <div className="flex gap-2 mt-2">
                    {item.status === 'accepted' && role === 'lender' && (
                        <button 
                            onClick={() => handleCompleteRequest(item.requestId)}
                            className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded transition-colors font-medium"
                        >
                            Mark Completed
                        </button>
                    )}
                    
                    {item.status === 'completed' && !reviewedTransactions.has(item.requestId) && (
                        <button 
                            onClick={async () => {
                                setRevieweeId(item.otherPartyId);
                                setReviewTransaction(item);
                                setIsReviewModalOpen(true);
                            }}
                            className="text-xs bg-accent/10 text-accent hover:bg-accent/20 px-2 py-1 rounded transition-colors font-medium flex items-center gap-1"
                        >
                            <Star className="w-3 h-3 fill-accent/50" />
                            Leave Review
                        </button>
                    )}
                    
                    {item.status === 'completed' && reviewedTransactions.has(item.requestId) && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Reviewed
                        </span>
                    )}
                </div>
            </div>
        </div>
        );
    };

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

                <Tabs defaultValue={defaultTab} className="w-full">
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
                                        <ItemCard 
                                            key={item.id} 
                                            item={item} 
                                            index={idx} 
                                            isOwnerView={true}
                                            onRequestClick={() => {}}
                                            onEdit={handleEditItem}
                                            onDelete={(itemToDelete) => {
                                                setItemToDelete(itemToDelete);
                                            }}
                                            onStatusChange={async (itemToUpdate, newStatus) => {
                                                try {
                                                    await updateItemStatus(itemToUpdate.id, newStatus as any);
                                                    setListings(prev => prev.map(l => l.id === itemToUpdate.id ? { ...l, status: newStatus as any } : l));
                                                    toast.success(`Status → ${newStatus}`);
                                                } catch { 
                                                    toast.error('Failed to update status'); 
                                                }
                                            }}
                                        />
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
                                await performAction(
                                    () => deleteItem(itemToDelete.id, user.uid),
                                    {
                                        successMessage: 'Item deleted permanently',
                                        onSuccess: () => {
                                            setListings(prev => prev.filter(l => l.id !== itemToDelete.id));
                                            setItemToDelete(null);
                                        }
                                    }
                                );
                            }}
                            className="bg-red-600 focus:ring-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Item
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <ReviewModal
               isOpen={isReviewModalOpen}
               transaction={reviewTransaction}
               onClose={() => {
                   setIsReviewModalOpen(false);
                   setReviewTransaction(null);
               }}
               onSuccess={() => {
                   if (reviewTransaction) {
                       setReviewedTransactions(prev => new Set(prev).add(reviewTransaction.requestId));
                   }
                   // Also refresh history to update the trust score UI if needed
                   if (user) {
                       fetchUserLendingHistory(user.uid).then(setLendingHistory);
                   }
               }}
               revieweeId={revieweeId}
            />
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        }>
            <ProfilePageContent />
        </Suspense>
    );
}
