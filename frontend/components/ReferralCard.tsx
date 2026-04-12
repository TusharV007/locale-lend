"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Share2, Users, Star, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface ReferralCardProps {
    referralCode: string;
    referralCount: number;
    referralPoints: number;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({ referralCode, referralCount, referralPoints }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        toast.success("Referral code copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Join Local Share!',
            text: `Join me on Local Share and borrow items from your neighbors! Use my referral code: ${referralCode}`,
            url: window.location.origin + '/auth?ref=' + referralCode,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                copyToClipboard();
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Main Referral & Points Card */}
            <div className="grid md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Gift size={120} />
                        </div>
                        
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Award className="w-6 h-6" />
                                Referral Points
                            </CardTitle>
                            <CardDescription className="text-primary-foreground/70">
                                Your contribution to the community
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="pt-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-bold">{referralPoints}</span>
                                <span className="text-xl opacity-80 font-medium">Points</span>
                            </div>
                            
                            <div className="mt-8">
                                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm w-fit min-w-[120px]">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Users className="w-4 h-4 opacity-70" />
                                        <span className="text-xs font-medium opacity-70">Referrals</span>
                                    </div>
                                    <p className="text-xl font-bold">{referralCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <Card className="h-full border border-primary/20 bg-card/50 backdrop-blur-md shadow-lg flex flex-col justify-center">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-primary" />
                                Invite Neighbors
                            </CardTitle>
                            <CardDescription>
                                Give 50 points, get 50 points when they join.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="relative">
                                <div className="bg-secondary/50 rounded-lg p-4 border border-border flex items-center justify-between group hover:border-primary/50 transition-colors">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Your Unique Code</p>
                                        <p className="text-2xl font-mono font-bold tracking-widest text-foreground">{referralCode}</p>
                                    </div>
                                    <Button 
                                        onClick={copyToClipboard}
                                        size="icon" 
                                        variant="ghost"
                                        className="h-12 w-12 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                                    >
                                        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                    </Button>
                                </div>
                            </div>

                            <Button onClick={handleShare} className="w-full h-12 text-md font-semibold gap-2 shadow-lg shadow-primary/20">
                                <Share2 className="w-4 h-4" />
                                Share Invitation Link
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* How it works info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Invite neighbors', desc: 'Share your link with your community', icon: Users, color: 'text-blue-500' },
                    { label: 'They join', desc: 'Get 50 points immediately on sign up', icon: Check, color: 'text-green-500' },
                    { label: 'Share more', desc: 'Earn points for every borrow/lend', icon: Gift, color: 'text-purple-500' },
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + (i * 0.1) }}
                        className="p-4 rounded-xl bg-card border shadow-sm flex items-start gap-3"
                    >
                        <div className={`p-2 rounded-lg bg-secondary ${item.color}`}>
                            <item.icon size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
