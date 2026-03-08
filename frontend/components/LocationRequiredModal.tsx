import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface LocationRequiredModalProps {
  isOpen: boolean;
  onRetry: () => void;
}

export function LocationRequiredModal({ isOpen, onRetry }: LocationRequiredModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for permission changes automatically
  useEffect(() => {
    if (!isOpen || !navigator.permissions || !navigator.permissions.query) return;

    let permissionStatus: PermissionStatus;

    const checkPermission = async () => {
      try {
        permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        permissionStatus.onchange = () => {
          if (permissionStatus.state === 'granted') {
            onRetry();
          }
        };
      } catch (error) {
        console.error("Permission query failed:", error);
      }
    };

    checkPermission();

    return () => {
      if (permissionStatus && permissionStatus.onchange) {
        permissionStatus.onchange = null;
      }
    };
  }, [isOpen, onRetry]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-card rounded-2xl shadow-xl z-10 overflow-hidden border p-8 text-center"
          >
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold mb-3">Location Required</h2>
            
            <p className="text-muted-foreground mb-6">
              LocalShare relies on your location to find items available in your neighborhood. 
              Please enable location access in your browser settings to continue.
            </p>
            
            <div className="bg-secondary/50 rounded-lg p-4 mb-6 text-sm text-left">
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <strong>How to enable:</strong>
                  <ol className="list-decimal ml-4 mt-2 space-y-1 text-muted-foreground">
                    <li>Click the <strong>lock</strong> or <strong>info</strong> icon in your browser's address bar.</li>
                    <li>Find <strong>Location</strong> and set it to <strong>Allow</strong>.</li>
                    <li>Click the button below to try again.</li>
                  </ol>
                </div>
              </div>
            </div>

            <Button 
              onClick={onRetry} 
              className="w-full" 
              size="lg"
            >
              Enable Location Access
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
