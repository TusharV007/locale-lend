"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Users, Shield } from 'lucide-react';

export default function AuthPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left panel — brand & features (hidden on mobile) */}
            <div className="hidden lg:flex flex-col justify-between w-[45%] bg-primary p-12 text-primary-foreground relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0">
                    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/3" />
                </div>

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold">Local Share</span>
                    </Link>

                    <div className="space-y-6">
                        <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                            Borrow from neighbors,<br />not the store
                        </h1>
                        <p className="text-primary-foreground/80 text-lg max-w-sm">
                            Connect with your community to share tools, gear, and everyday items. Save money, reduce waste, build trust.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 space-y-4">
                    {[
                        { icon: Users, label: '2,400+ neighbors sharing resources' },
                        { icon: Shield, label: 'Verified users with trust scores' },
                        { icon: MapPin, label: '150+ active neighborhoods' },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-3 text-primary-foreground/90">
                            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel — auth form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile brand */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold text-foreground">Local Share</span>
                        </Link>
                        <p className="text-muted-foreground text-sm">Connect with your neighbors</p>
                    </div>

                    <AuthForm />
                </motion.div>
            </div>
        </div>
    );
};
