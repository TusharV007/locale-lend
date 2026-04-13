import { useCallback } from 'react';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import { GeoJSONPoint } from '@/types';

export function useLocation() {
    const { userLocation, setUserLocation } = useStore();

    const requestUserLocation = useCallback((silent = false) => {
        if (!navigator.geolocation) {
            if (!silent) toast.error("Geolocation not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const userPos: GeoJSONPoint = { 
                    type: 'Point', 
                    coordinates: [longitude, latitude] 
                };
                setUserLocation(userPos);
                if (!silent) toast.success("Location found!", { description: "Showing items near you." });
            },
            (error) => {
                // Only log errors to console if NOT a silent background request
                if (!silent) {
                    console.error(`Location access error (code ${error.code}): ${error.message}`);
                    
                    if (error.code === error.PERMISSION_DENIED) {
                        toast.error("Location access required", { 
                            description: "Please allow location access in your browser settings to see nearby items." 
                        });
                    } else {
                        toast.error("Failed to get location");
                    }
                }
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    }, [setUserLocation]);

    return {
        userLocation,
        requestUserLocation
    };
}
