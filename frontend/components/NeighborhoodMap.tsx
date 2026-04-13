import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import type { Item, GeoJSONPoint } from '@/types';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
} catch (error) {
  console.error("Failed to fix Leaflet icons:", error);
}

// Custom marker icon creator
const createCustomIcon = (category: string, avatarUrl?: string, ownerName?: string) => {
  const colors: Record<string, string> = {
    Tools: '#d97706',
    Electronics: '#3b82f6',
    Kitchen: '#ec4899',
    Outdoor: '#22c55e',
    Books: '#8b5cf6',
    Sports: '#f97316',
    user: '#166534',
  };

  const color = colors[category] || colors.Tools;
  const isDummyAvatar = avatarUrl === 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
  const imageHtml = avatarUrl && !isDummyAvatar
    ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
    : ownerName
      ? `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 600; color: white; font-size: 16px;">${ownerName.charAt(0).toUpperCase()}</div>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      ">
        ${imageHtml}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// User location marker
const createUserLocationIcon = (avatarUrl?: string, name?: string) => {
  const imageHtml = avatarUrl
    ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
    : name
      ? `<div style="width: 100%; height: 100%; background: #166534; display: flex; align-items: center; justify-content: center; font-weight: 600; color: white; border-radius: 50%; font-size: 14px;">${name.charAt(0).toUpperCase()}</div>`
      : `<div style="width: 100%; height: 100%; background: #166534; border-radius: 50%;"></div>`;

  return L.divIcon({
    className: 'user-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: 32px;
          height: 32px;
          background: white;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          z-index: 2;
        ">
          ${imageHtml}
        </div>
        <div class="user-location-pulse" style="
          position: absolute;
          top: 0;
          left: 0;
          width: 32px;
          height: 32px;
          background: rgba(22, 101, 52, 0.6);
          border-radius: 50%;
          z-index: 1;
          pointer-events: none;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

interface NeighborhoodMapProps {
  userLocation: GeoJSONPoint;
  userAvatar?: string;
  userName?: string;
  items: Item[];
  onItemSelect: (item: Item) => void;
  onRequestClick: (item: Item) => void;
  onViewProfile: (user: any) => void;
}

/**
 * NeighborhoodMap Component
 * 
 * Uses vanilla Leaflet (not react-leaflet) to avoid React 18 compatibility issues.
 * This approach gives us more control and avoids the Context.Consumer errors.
 */
export function NeighborhoodMap({
  userLocation,
  userAvatar,
  userName,
  items,
  onItemSelect,
  onRequestClick,
  onViewProfile,
}: NeighborhoodMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocationRef = useRef<string>('');

  useEffect(() => {
    const locationKey = JSON.stringify(userLocation);

    if (!mapRef.current || userLocationRef.current === locationKey) return;

    // Clear existing map if location changed
    if (mapInstanceRef.current && userLocationRef.current !== '') {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    userLocationRef.current = locationKey;

    // Extract coordinates safely
    const userLoc = userLocation as any;
    const userCoords = userLoc.coordinates || (userLoc.lng !== undefined && userLoc.lat !== undefined ? [userLoc.lng, userLoc.lat] : [80.4365, 16.3067]);
    
    const center: [number, number] = [
      userCoords[1] || 16.3067, // latitude
      userCoords[0] || 80.4365  // longitude
    ];

    // Initialize map
    const map = L.map(mapRef.current, {
      center: center,
      zoom: 15,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    // Add user location marker
    L.marker(center, { icon: createUserLocationIcon(userAvatar, userName) })
      .addTo(map)
      .bindPopup(`
        <div style="padding: 8px; text-align: center;">
          <p style="font-weight: 600; color: #1a1a1a; margin: 0;">You are here</p>
          <p style="font-size: 14px; color: #666; margin: 4px 0 0 0;">Searching nearby...</p>
        </div>
      `);

    // Initialize markers layer
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;
    setIsLoaded(true);

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        userLocationRef.current = '';
      }
    };
  }, [userLocation]); // React to userLocation changes

  // Update markers when items change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    items.forEach((item) => {
      const itemLoc = item.location as any;
      if (!itemLoc) return;
      
      // GeoJSON is [lng, lat], Leaflet wants [lat, lng]
      const coords = itemLoc.coordinates || (itemLoc.lng !== undefined && itemLoc.lat !== undefined ? [itemLoc.lng, itemLoc.lat] : null);
      if (!coords || coords.length < 2) return;

      const position: [number, number] = [
        coords[1], // lat
        coords[0], // lng
      ];

      const marker = L.marker(position, { icon: createCustomIcon(item.category, item.owner?.avatar, item.owner?.name) });

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;">
          <div style="position: relative; height: 120px; margin: -1px -1px 8px -1px; border-radius: 8px 8px 0 0; overflow: hidden;">
            <img src="${item.images[0]}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <h3 style="font-weight: 600; color: #1a1a1a; margin: 0 0 4px 0; font-size: 14px;">${item.title}</h3>
          <div style="display: flex; gap: 8px; font-size: 12px; color: #666; margin-bottom: 8px;">
            <span style="display: flex; align-items: center; gap: 4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              ${item.distance}m
            </span>
            <span>•</span>
            <span style="display: flex; align-items: center; gap: 4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ${item.owner.trustScore.toFixed(1)}
            </span>
            <span>•</span>
            <span 
              id="profile-link-${item.id}"
              style="color: #3b82f6; text-decoration: underline; cursor: pointer;"
            >
              View Profile
            </span>
          </div>
          ${item.availabilityStatus === 'Available' ? `
            <button 
              id="request-btn-${item.id}"
              style="
                width: 100%;
                padding: 8px 12px;
                background: linear-gradient(135deg, #d97706 0%, #c2410c 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 13px;
                cursor: pointer;
              "
            >
              Request to Borrow
            </button>
          ` : `
            <span style="display: block; text-align: center; padding: 8px; background: #f3f4f6; border-radius: 8px; font-size: 13px; color: #6b7280;">
              ${item.availabilityStatus}
            </span>
          `}
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onItemSelect(item);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`request-btn-${item.id}`);
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onRequestClick(item);
            mapInstanceRef.current?.closePopup();
          });
        }

        const profileBtn = document.getElementById(`profile-link-${item.id}`);
        if (profileBtn) {
          profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onViewProfile(item.owner);
            mapInstanceRef.current?.closePopup();
          });
        }
      });

      markersLayer.addLayer(marker);
    });
  }, [items, onItemSelect, onRequestClick]); // Update when items change

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-card"
    >
      <div ref={mapRef} className="w-full h-full" />

      {/* Map overlay legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-card z-[1000]">
        <p className="text-xs font-medium text-muted-foreground mb-2">Nearby Items</p>
        <p className="text-2xl font-bold text-card-foreground">{items.length}</p>
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 bg-secondary flex items-center justify-center">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      )}
    </motion.div>
  );
}
