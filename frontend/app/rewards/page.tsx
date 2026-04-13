"use client";

import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Gift, History, Gift as LucideGift } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchUserProfile, fetchReferralPointsHistory } from '@/lib/db';
import { ReferralCard } from '@/components/ReferralCard';
import { User as DBUser } from '@/types';

function RewardsPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [fullProfile, setFullProfile] = useState<DBUser | null>(null);
    const [pointsHistory, setPointsHistory] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !user) router.push('/auth');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;
        const loadAll = async () => {
            setLoading(true);
            try {
                // Fetch full profile for referral points and referral code
                const profile = await fetchUserProfile(user.uid);
                setFullProfile(profile);

                // Fetch points history
                const history = await fetchReferralPointsHistory(user.uid);
                setPointsHistory(history);
            } catch (err) {
                console.error("Failed to load rewards data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, [user]);

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
            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <LucideGift className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Community Rewards</h1>
                            <p className="text-muted-foreground">Share items, help neighbors, and earn points together.</p>
                        </div>
                    </div>
                    
                    <div className="grid gap-8">
                        {fullProfile && (
                            <ReferralCard 
                                referralCode={fullProfile.referralCode || 'NOTSET'} 
                                referralCount={fullProfile.referralCount || 0}
                                referralPoints={fullProfile.referralPoints || 0}
                            />
                        )}

                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                <History className="w-5 h-5 text-muted-foreground" />
                                Reward Activity
                            </h3>
                            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
                                {pointsHistory.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {pointsHistory.map((item) => (
                                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${item.amount > 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                                        {item.amount > 0 ? '+' : ''}{item.amount}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{item.reason}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.timestamp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                                                    Points
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-16 text-center text-muted-foreground">
                                        <LucideGift className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p className="text-lg font-medium mb-1">No points earned yet</p>
                                        <p className="text-sm">Start linding your items to neighbors to earn Community Points!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="grid sm:grid-cols-2 gap-4 mt-4">
                            <div className="p-6 bg-secondary/30 rounded-2xl border border-border/50">
                                <h4 className="font-bold mb-2">How to earn points?</h4>
                                <ul className="text-sm space-y-2 text-muted-foreground">
                                    <li>• Successfully lend an item: <strong>20 pts</strong></li>
                                    <li>• Return an item on time: <strong>10 pts</strong></li>
                                    <li>• Refer a new neighbor: <strong>50 pts</strong></li>
                                    <li>• Leave a helpful review: <strong>5 pts</strong></li>
                                </ul>
                            </div>
                            <div className="p-6 bg-secondary/30 rounded-2xl border border-border/50">
                                <h4 className="font-bold mb-2">Coming Soon</h4>
                                <p className="text-sm text-muted-foreground">
                                    We are working on exciting ways to redeem your points for premium features, platform badges, and local community discounts!
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default function RewardsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        }>
            <RewardsPageContent />
        </Suspense>
    );
}
