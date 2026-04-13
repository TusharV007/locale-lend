"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export const useReferral = () => {
    const searchParams = useSearchParams();
    
    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            console.log("Captured referral code:", ref);
            sessionStorage.setItem('pending_referral', ref);
        }
    }, [searchParams]);

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
