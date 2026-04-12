import { motion } from 'framer-motion';
import { MapPin, Users, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface HeroSectionProps {
  onExploreClick: () => void;
}

export function HeroSection({ onExploreClick }: HeroSectionProps) {
  const [stats, setStats] = useState({
    users: '1000+',
    neighborhoods: '150+',
    items: '10k+'
  });

  /* 
  useEffect(() => {
    // TODO: Implement Firestore count fetching if needed.
    // For now, using static placeholders avoids "Failed to fetch" error.
  }, []);
  */

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
              >
                <Users className="w-4 h-4" />
                <span>Join 2,400+ neighbors sharing resources</span>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                Borrow from{' '}
                <span className="text-primary">neighbors</span>,
                <br />
                not the store
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                Why buy when you can borrow? Connect with trusted neighbors to share tools,
                gear, and everyday items. Save money, reduce waste, build community.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="xl"
                variant="hero"
                onClick={onExploreClick}
                className="group"
              >
                Explore Nearby Items
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="xl" variant="outline">
                List Your Items
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 pt-4">
              {[
                { icon: Shield, label: 'Verified Users', value: stats.users },
                { icon: MapPin, label: 'Active Neighborhoods', value: stats.neighborhoods },
                { icon: Users, label: 'Items Shared', value: stats.items },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative hidden md:block"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Decorative rings */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-pulse" />
              <div className="absolute inset-8 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-16 rounded-full border-2 border-primary/30" />

              {/* Center circle */}
              <div className="absolute inset-24 rounded-full hero-gradient flex items-center justify-center shadow-hover">
                <MapPin className="w-16 h-16 text-primary-foreground" />
              </div>

              {/* Floating item cards */}
              {[
                { top: '5%', left: '10%', label: 'Circular Saw', delay: 0 },
                { top: '15%', right: '5%', label: 'Camera', delay: 0.1 },
                { bottom: '20%', left: '0%', label: 'Lawn Mower', delay: 0.2 },
                { bottom: '10%', right: '10%', label: 'Concrete Mixer', delay: 0.3 },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + item.delay }}
                  style={{
                    position: 'absolute',
                    top: item.top,
                    left: item.left,
                    right: item.right,
                    bottom: item.bottom,
                  }}
                  className="px-4 py-2 bg-card rounded-lg shadow-card animate-float"
                >
                  <span className="text-sm font-medium text-card-foreground">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
