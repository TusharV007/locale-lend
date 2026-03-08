"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { AddItemModal } from '@/components/AddItemModal';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Mail, MapPin, Calendar, Package, TrendingUp, Award, LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { fetchUserItems, fetchUserProfile, updateUserProfile } from '@/lib/db';
import type { Item, BankDetails, User as UserType } from '@/types';

export default function SettingsPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [userItems, setUserItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [isSavingBank, setIsSavingBank] = useState(false);
    const [bankDetails, setBankDetails] = useState<BankDetails>({
        accountName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        updatedAt: new Date()
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const loadUserData = async () => {
            if (!user) return;
            try {
                const [itemsResult, profileResult] = await Promise.all([
                    fetchUserItems(user.uid),
                    fetchUserProfile(user.uid)
                ]);
                
                setUserItems(itemsResult.items);
                if (profileResult?.bankDetails) {
                    setBankDetails(profileResult.bankDetails);
                }
            } catch (error) {
                console.error('Failed to load user data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadUserData();
        }
    }, [user]);

    const handleSaveBankDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Basic validation
        if (bankDetails.ifscCode.length !== 11) {
            toast.error('IFSC Code must be 11 characters');
            return;
        }
        if (bankDetails.accountNumber.length < 9) {
            toast.error('Please enter a valid Account Number');
            return;
        }

        setIsSavingBank(true);
        try {
            await updateUserProfile(user.uid, { bankDetails });
            toast.success('Payout information updated!');
        } catch (error) {
            toast.error('Failed to save bank details');
        } finally {
            setIsSavingBank(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully');
            router.push('/auth');
        } catch (error) {
            toast.error('Failed to logout');
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const stats = {
        itemsListed: userItems.length,
        itemsLent: userItems.filter(item => item.status === 'lended').length,
        itemsAvailable: userItems.filter(item => item.status === 'available').length,
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar onAddItemClick={() => setIsAddItemModalOpen(true)} />

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
                    <p className="text-muted-foreground">Manage your profile and account preferences</p>
                </motion.div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border rounded-2xl p-8 mb-6 shadow-sm"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                            {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-1">{user.displayName || 'User'}</h2>
                            <p className="text-muted-foreground mb-3">{user.email}</p>
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                    <Shield className="w-3 h-3" />
                                    Verified Account
                                </span>
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-medium">
                                    <Award className="w-3 h-3" />
                                    Active Member
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-secondary/50 rounded-xl p-4 text-center">
                            <Package className="w-6 h-6 mx-auto mb-2 text-primary" />
                            <p className="text-2xl font-bold">{stats.itemsListed}</p>
                            <p className="text-xs text-muted-foreground">Items Listed</p>
                        </div>
                        <div className="bg-secondary/50 rounded-xl p-4 text-center">
                            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
                            <p className="text-2xl font-bold">{stats.itemsLent}</p>
                            <p className="text-xs text-muted-foreground">Items Lent</p>
                        </div>
                        <div className="bg-secondary/50 rounded-xl p-4 text-center">
                            <Award className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                            <p className="text-2xl font-bold">{stats.itemsAvailable}</p>
                            <p className="text-xs text-muted-foreground">Available</p>
                        </div>
                    </div>
                </motion.div>

                {/* Account Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border rounded-2xl p-6 mb-6 shadow-sm"
                >
                    <h3 className="text-lg font-semibold mb-4">Account Details</h3>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                            <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Display Name</p>
                                <p className="text-sm text-muted-foreground">{user.displayName || 'Not set'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                            <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Email Address</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Member Since</p>
                                <p className="text-sm text-muted-foreground">
                                    {(user as any).metadata?.creationTime
                                        ? new Date((user as any).metadata.creationTime).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })
                                        : 'Unknown'
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Last Sign In</p>
                                <p className="text-sm text-muted-foreground">
                                    {(user as any).metadata?.lastSignInTime
                                        ? new Date((user as any).metadata.lastSignInTime).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : 'Unknown'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
 
                {/* Payout Information (Bank Details) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-card border rounded-2xl p-6 mb-6 shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Payout Information</h3>
                    </div>

                    <form onSubmit={handleSaveBankDetails} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Account Holder Name</label>
                                <input
                                    type="text"
                                    value={bankDetails.accountName}
                                    onChange={e => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Full name as per bank"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bank Name</label>
                                <input
                                    type="text"
                                    value={bankDetails.bankName}
                                    onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g. HDFC Bank"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Account Number</label>
                                <input
                                    type="text"
                                    value={bankDetails.accountNumber}
                                    onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Enter account number"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">IFSC Code</label>
                                <input
                                    type="text"
                                    value={bankDetails.ifscCode}
                                    onChange={e => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                                    maxLength={11}
                                    className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase"
                                    placeholder="e.g. HDFC0001234"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSavingBank}
                                className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSavingBank ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Payout Information'
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card border rounded-2xl p-6 shadow-sm"
                >
                    <h3 className="text-lg font-semibold mb-4">Account Actions</h3>

                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/profile')}
                            className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-muted-foreground" />
                                <div className="text-left">
                                    <p className="font-medium">My Items</p>
                                    <p className="text-xs text-muted-foreground">View and manage your listings</p>
                                </div>
                            </div>
                            <span className="text-muted-foreground">→</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-between p-4 rounded-lg border border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-red-600"
                        >
                            <div className="flex items-center gap-3">
                                <LogOut className="w-5 h-5" />
                                <div className="text-left">
                                    <p className="font-medium">Logout</p>
                                    <p className="text-xs opacity-75">Sign out of your account</p>
                                </div>
                            </div>
                            <span>→</span>
                        </button>
                    </div>
                </motion.div>
            </main>

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
