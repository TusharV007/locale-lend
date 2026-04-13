"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// Component responsible ONLY for capturing the referral code from the URL
export function ReferralCapturer() {
    const searchParams = useSearchParams();
    
    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            console.log("Captured referral code:", ref);
            sessionStorage.setItem('pending_referral', ref);
        }
    }, [searchParams]);

    return null;
}

// Hook for utility functions that DON'T depend on search params
export const useReferral = () => {
    const getPendingReferral = () => {
        if (typeof window === 'undefined') return null;
        return sessionStorage.getItem('pending_referral');
    };

    const clearPendingReferral = () => {
        if (typeof window === 'undefined') return;
        sessionStorage.removeItem('pending_referral');
    };

    return { getPendingReferral, clearPendingReferral };
};
