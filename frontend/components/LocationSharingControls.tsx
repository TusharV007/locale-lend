"use client";

import { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocationSharing } from '@/hooks/useLocationSharing';
import { LiveLocationMap } from './LiveLocationMap';
import { enableLocationSharing, disableLocationSharing, updateSharedLocation } from '@/lib/db';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import type { GeoJSONPoint } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface LocationSharingControlsProps {
    requestId: string;
    userId: string;
    isOwner: boolean;
    isBorrower: boolean;
    otherPartyName: string;
}

export default function LocationSharingControls({
    requestId,
    userId,
    isOwner,
    isBorrower,
    otherPartyName
}: LocationSharingControlsProps) {
    const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);
    const [sharedLocation, setSharedLocation] = useState<GeoJSONPoint | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [showLocationMap, setShowLocationMap] = useState(false);
    const { user } = useAuth();

    const { startSharing, stopSharing, currentLocation, error: locationError, isSharing } = useLocationSharing();

    // Listen to location sharing updates from Firestore
    useEffect(() => {
        if (!requestId) return;

        const requestRef = doc(db, 'requests', requestId);
        const unsubscribe = onSnapshot(requestRef, (docSnap) => {
            const data = docSnap.data();
            if (data?.locationSharing) {
                setLocationSharingEnabled(data.locationSharing.enabled || false);
                setSharedLocation(data.locationSharing.sharedLocation);
                if (data.locationSharing.lastUpdated) {
                    setLastUpdated(data.locationSharing.lastUpdated.toDate());
                }
            }
        });

        return () => unsubscribe();
    }, [requestId]);

    // Auto-update location when sharing is enabled
    useEffect(() => {
        if (isOwner && locationSharingEnabled && currentLocation) {
            updateSharedLocation(requestId, currentLocation).catch(err => {
                console.error('Failed to update location:', err);
            });
        }
    }, [currentLocation, locationSharingEnabled, isOwner, requestId]);

    const handleToggleLocationSharing = async () => {
        try {
            if (locationSharingEnabled) {
                await disableLocationSharing(requestId);
                stopSharing();
                toast.success('Location sharing stopped');
            } else {
                await enableLocationSharing(requestId);
                startSharing();
                toast.success('Location sharing enabled');
            }
        } catch (error) {
            toast.error('Failed to toggle location sharing');
            console.error(error);
        }
    };

    return (
        <>
            <div className="flex items-center gap-2">
                {isOwner && (
                    <Button
                        onClick={handleToggleLocationSharing}
                        variant={locationSharingEnabled ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                    >
                        <MapPin className="w-4 h-4 mr-2" />
                        {locationSharingEnabled ? 'Stop Sharing Location' : 'Share My Location'}
                    </Button>
                )}

                {isBorrower && locationSharingEnabled && sharedLocation && (
                    <Button
                        onClick={() => setShowLocationMap(true)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                    >
                        <Navigation className="w-4 h-4 mr-2" />
                        View Owner's Location
                    </Button>
                )}
            </div>

            {showLocationMap && sharedLocation && (
                <LiveLocationMap
                    isOpen={showLocationMap}
                    onClose={() => setShowLocationMap(false)}
                    ownerLocation={sharedLocation}
                    borrowerLocation={currentLocation || undefined}
                    ownerName={otherPartyName}
                    lastUpdated={lastUpdated}
                    borrowerName={user?.displayName || 'User'}
                    borrowerAvatar={user?.photoURL || undefined}
                />
            )}
        </>
    );
}
