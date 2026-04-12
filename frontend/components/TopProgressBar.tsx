"use client";

import { useEffect, useState } from 'react';
import * as Progress from '@radix-ui/react-progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';

export function TopProgressBar() {
  const { globalLoading, globalProgress } = useStore();
  const [displayProgress, setDisplayProgress] = useState(0);

  // Sync state with local state for smoother animations if needed, 
  // though framer-motion handles it well
  useEffect(() => {
    setDisplayProgress(globalProgress);
  }, [globalProgress]);

  return (
    <AnimatePresence>
      {globalLoading && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-background origin-top"
        >
          <Progress.Root
            className="relative overflow-hidden bg-primary/20 w-full h-full"
            value={displayProgress}
          >
            <Progress.Indicator
              className="bg-primary w-full h-full transition-all duration-500 ease-out"
              style={{ transform: `translateX(-${100 - displayProgress}%)` }}
            />
            
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" 
                 style={{ backgroundSize: '200% 100%' }} />
          </Progress.Root>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
