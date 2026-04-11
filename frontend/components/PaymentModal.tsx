"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, IndianRupee, CheckCircle2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPayment } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestId: string;
    itemTitle: string;
    itemId: string;
    lenderId: string;
    lenderName: string;
    rentalPricePerDay?: number;
    rentalDays?: number;
    onSuccess: () => void;
}

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export function PaymentModal({
    isOpen,
    onClose,
    requestId,
    itemTitle,
    itemId,
    lenderId,
    lenderName,
    rentalPricePerDay = 0,
    rentalDays = 1,
    onSuccess,
}: PaymentModalProps) {
    const { user } = useAuth();
    const [isPaying, setIsPaying] = useState(false);
    const [paid, setPaid] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const amount = (rentalPricePerDay > 0 ? rentalPricePerDay : 0) * (rentalDays > 0 ? rentalDays : 1);

    const handlePay = async () => {
        if (!user) return;
        console.log("Initializing payment of:", amount, "for:", itemTitle);
        setIsPaying(true);
        try {
            if (amount === 0) {
                // Free transaction bypass
                await createPayment({
                    requestId,
                    itemId,
                    itemTitle,
                    payerId: user.uid,
                    payerName: user.displayName || 'Unknown',
                    receiverId: lenderId,
                    receiverName: lenderName,
                    amount: 0,
                    currency: 'INR',
                });
                setPaid(true);
                toast.success('Confirmed successfully!');
                setTimeout(() => { onSuccess(); onClose(); }, 1500);
                return;
            }

            // Load Razorpay
            const res = await loadRazorpayScript();
            if (!res) {
                toast.error('Razorpay SDK failed to load. Are you online?');
                return;
            }

            // Create Order
            const result = await fetch('/api/razorpay/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, requestId })
            });

            if (!result.ok) throw new Error('Failed to create order');
            const order = await result.json();

            // Open Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'LocalShare',
                description: `Rental payment for ${itemTitle}`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch('/api/razorpay/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(response)
                        });
                        
                        if (verifyRes.ok) {
                            await createPayment({
                                requestId,
                                itemId,
                                itemTitle,
                                payerId: user.uid,
                                payerName: user.displayName || 'Unknown',
                                receiverId: lenderId,
                                receiverName: lenderName,
                                amount,
                                currency: 'INR',
                            });
                            setPaid(true);
                            toast.success('Payment successful!', { description: `₹${amount} sent to ${lenderName}` });
                            setTimeout(() => { onSuccess(); onClose(); }, 1500);
                        } else {
                            toast.error('Payment verification failed. Please contact support.');
                        }
                    } catch (err) {
                        console.error(err);
                        toast.error('Error verifying payment.');
                    }
                },
                prefill: {
                    name: user.displayName || '',
                    email: user.email || '',
                },
                theme: { color: "#22c55e" },
                modal: {
                    ondismiss: function() {
                        setIsPaying(false);
                    }
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.on('payment.failed', function (response: any) {
                toast.error(response.error.description || 'Payment Failed');
            });
            paymentObject.open();
        } catch (error) {
            console.error(error);
            toast.error('Payment initialization failed. Please try again.');
            setIsPaying(false);
        }
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-md bg-card border rounded-2xl shadow-xl z-10 overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Secure Payment</h2>
                                <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
                                    <Shield className="w-3 h-3" /> Secure via Razorpay
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-6 space-y-5">
                        {paid ? (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center py-8"
                            >
                                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
                                <h3 className="text-xl font-bold text-foreground">Payment Successful!</h3>
                                <p className="text-muted-foreground mt-1">Your borrow request is confirmed.</p>
                            </motion.div>
                        ) : (
                            <>
                                {/* Item Summary */}
                                <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                                    <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">Payment Summary</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-foreground font-medium">{itemTitle}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span>To: {lenderName}</span>
                                    </div>
                                    {rentalDays && rentalDays > 1 && rentalPricePerDay && rentalPricePerDay > 0 && (
                                        <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                                            <span>Duration: {rentalDays} days</span>
                                            <span>(₹{rentalPricePerDay}/day)</span>
                                        </div>
                                    )}
                                    <div className="border-t pt-3 flex justify-between items-center">
                                        <span className="font-semibold text-foreground">Total Amount</span>
                                        <div className="flex items-center gap-1 text-xl font-bold text-primary">
                                            <IndianRupee className="w-5 h-5" />
                                            {amount > 0 ? amount.toFixed(2) : '0.00'}
                                        </div>
                                    </div>
                                    {amount === 0 && (
                                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> This item is shared for free!
                                        </p>
                                    )}
                                </div>

                                {/* Razorpay branding */}
                                <div className="flex flex-col items-center justify-center py-4 px-6 border border-dashed rounded-xl bg-secondary/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-sm font-medium text-muted-foreground">Credit / Debit / UPI / NetBanking</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/60 text-center">
                                        You will be redirected to Razorpay's secure checkout
                                    </p>
                                </div>

                                <p className="text-[10px] text-muted-foreground/60 text-center flex items-center justify-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    Your payment is processed securely. We don't store your card details.
                                </p>

                                <div className="flex gap-3 pt-2">
                                    <Button variant="outline" onClick={onClose} className="flex-1" disabled={isPaying}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handlePay} className="flex-1" disabled={isPaying}>
                                        {isPaying ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <IndianRupee className="w-4 h-4" />
                                                {amount > 0 ? `Pay ₹${amount}` : 'Confirm (Free)'}
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
