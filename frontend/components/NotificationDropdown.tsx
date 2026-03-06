"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, MessageCircle, HandshakeIcon, XCircle, Package } from 'lucide-react';
import { subscribeToNotifications, markAllNotificationsRead, type NotificationData } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export function NotificationDropdown() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToNotifications(user.uid, setNotifications);
        return () => unsubscribe();
    }, [user]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = async () => {
        if (!user) return;
        await markAllNotificationsRead(user.uid);
    };

    const getIcon = (type: NotificationData['type']) => {
        switch (type) {
            case 'request_accepted': return <HandshakeIcon className="w-4 h-4 text-green-500" />;
            case 'request_rejected': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'new_request': return <Package className="w-4 h-4 text-primary" />;
            default: return <MessageCircle className="w-4 h-4 text-muted-foreground" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
            <button
                className="relative p-2 rounded-full hover:bg-secondary transition-colors"
                onClick={() => setIsOpen(prev => !prev)}
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                                >
                                    <CheckCheck className="w-3 h-3" />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-border">
                            {notifications.length === 0 ? (
                                <div className="text-center py-10 px-4 text-muted-foreground">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <motion.div
                                        key={n.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => {
                                            setIsOpen(false);
                                            router.push('/messages');
                                        }}
                                        className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-secondary/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className="mt-0.5 w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground leading-tight">{n.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-muted-foreground/70 mt-1">
                                                {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!n.read && (
                                            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
