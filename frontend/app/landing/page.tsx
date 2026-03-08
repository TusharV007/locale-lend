"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Users, Shield, ArrowRight, Star, CheckCircle2,
  Package, Wrench, Laptop, ChefHat, Tent, BookOpen, Bike,
  Zap, Heart, RefreshCw, ChevronDown, Quote, Menu, X
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

// ─── Animation Variants ─────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }
  })
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7 } }
};

// ─── Section Wrapper ────────────────────────────────────────────────────────
function Section({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Stats Counter ───────────────────────────────────────────────────────────
function StatCard({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div variants={fadeUp} custom={delay} className="text-center">
      <p className="text-4xl md:text-5xl font-bold text-primary mb-1">{value}</p>
      <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">{label}</p>
    </motion.div>
  );
}

// ─── Feature Card ────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, color, delay }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="group relative bg-card border border-border rounded-2xl p-6 shadow-card hover:shadow-hover transition-all duration-300 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at top left, ${color}10, transparent 70%)` }} />
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4`}
        style={{ background: `${color}18` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ─── How It Works Step ────────────────────────────────────────────────────────
function Step({ number, title, description, delay }: { number: string; title: string; description: string; delay: number }) {
  return (
    <motion.div variants={fadeUp} custom={delay} className="flex gap-5">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-soft">
        {number}
      </div>
      <div className="pt-2">
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// ─── Testimonial Card ────────────────────────────────────────────────────────
function TestimonialCard({ quote, name, role, rating, delay }: {
  quote: string; name: string; role: string; rating: number; delay: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4"
    >
      <div className="flex gap-1">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-accent text-accent" />
        ))}
      </div>
      <Quote className="w-6 h-6 text-primary/30" />
      <p className="text-foreground text-sm leading-relaxed italic flex-1">"{quote}"</p>
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold text-sm">{name[0]}</span>
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Category Pill ───────────────────────────────────────────────────────────
function CategoryPill({ icon: Icon, label, color }: {
  icon: React.ComponentType<{ className?: string }>; label: string; color: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-soft cursor-default"
    >
      <Icon className="w-4 h-4" style={{ color }} />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </motion.div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function LandingNav({ onCTA }: { onCTA: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Testimonials', href: '#testimonials' },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-soft'
        : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Local Share" width={32} height={32} className="rounded-lg" unoptimized />
          <span className="text-xl font-bold text-foreground">Local Share</span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.href} href={l.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Button size="sm" onClick={onCTA} className="shadow-soft">
            Get Started <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-background/95 backdrop-blur-md border-b border-border px-4 pb-4 space-y-3"
        >
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              {l.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/auth"><Button variant="outline" className="w-full" size="sm">Sign In</Button></Link>
            <Button className="w-full" size="sm" onClick={onCTA}>Get Started</Button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const heroRef = useRef(null);

  const handleCTA = () => router.push('/auth');

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <LandingNav onCTA={handleCTA} />

      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-60 -right-60 w-[600px] h-[600px] rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] rounded-full bg-accent/8 blur-3xl" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
              backgroundSize: '48px 48px'
            }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={fadeUp} custom={0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
              <Zap className="w-4 h-4 fill-primary" />
              Community-powered sharing platform
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1}
              className="text-5xl md:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight text-foreground">
              Borrow from{' '}
              <span className="relative">
                <span className="text-primary">neighbors</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.5, ease: 'easeOut' }}
                  className="absolute bottom-1 left-0 right-0 h-1 bg-primary/30 rounded-full origin-left"
                />
              </span>
              ,<br />not the store
            </motion.h1>

            <motion.p variants={fadeUp} custom={2}
              className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Why buy when you can borrow? LocalShare connects you with trusted neighbors
              to share tools, gear, and everyday items — saving money, reducing waste,
              and building real community.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4">
              <Button size="xl" onClick={handleCTA} className="group shadow-accent">
                Start Borrowing Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="xl" variant="outline" onClick={() => scrollToSection('how-it-works')}>
                See How It Works
                <ChevronDown className="w-5 h-5" />
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center gap-6 pt-2">
              {[
                { icon: CheckCircle2, text: 'Free to join' },
                { icon: Shield, text: 'Verified users' },
                { icon: Heart, text: 'No hidden fees' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="font-medium">{text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            {/* Central orb */}
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 rounded-full border border-primary/10 animate-pulse" />
              <div className="absolute inset-8 rounded-full border border-primary/15" />
              <div className="absolute inset-16 rounded-full border border-primary/20" />
              <div className="absolute inset-24 rounded-full hero-gradient shadow-hover flex items-center justify-center">
                <MapPin className="w-14 h-14 text-primary-foreground drop-shadow-lg" />
              </div>

              {/* Floating item cards */}
              {[
                { style: { top: '4%', left: '8%' }, label: '🔧 Power Drill', sub: '0.3km away', delay: 0 },
                { style: { top: '12%', right: '4%' }, label: '📷 Camera', sub: '0.8km away', delay: 0.15 },
                { style: { bottom: '22%', left: '0%' }, label: '⛺ Tent', sub: '1.2km away', delay: 0.3 },
                { style: { bottom: '8%', right: '8%' }, label: '🎂 Stand Mixer', sub: '0.5km away', delay: 0.45 },
                { style: { top: '45%', right: '-4%' }, label: '📚 Books', sub: '0.1km away', delay: 0.6 },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + item.delay, duration: 0.5, ease: 'easeOut' }}
                  style={{ position: 'absolute', ...item.style }}
                  className="animate-float bg-card border border-border rounded-xl px-4 py-2.5 shadow-card"
                  set={{ animationDelay: `${item.delay}s` } as any}
                >
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-primary font-medium">{item.sub}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={() => scrollToSection('stats')}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-xs font-medium uppercase tracking-widest">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </section>

      {/* ═══ STATS ═════════════════════════════════════════════════════════ */}
      <Section id="stats" className="py-20 bg-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {[
              { value: '2,400+', label: 'Active users' },
              { value: '10k+', label: 'Items shared' },
              { value: '150+', label: 'Neighborhoods' },
              { value: '₹0', label: 'Platform fee' },
            ].map(({ value, label }, i) => (
              <motion.div key={label} variants={fadeUp} custom={i} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-primary-foreground mb-1">{value}</p>
                <p className="text-sm text-primary-foreground/70 font-medium uppercase tracking-widest">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ HOW IT WORKS ══════════════════════════════════════════════════ */}
      <Section id="how-it-works" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-sm font-semibold text-primary uppercase tracking-widest">Simple process</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold text-foreground">How LocalShare works</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Get started in minutes. No subscriptions, no complexity.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              {[
                {
                  number: '1',
                  title: 'Create your free account',
                  description: 'Sign up in seconds with email. Your profile is your trust identity — build it by listing items and completing successful exchanges.'
                },
                {
                  number: '2',
                  title: 'Browse your neighborhood',
                  description: 'See items available near you on an interactive map. Filter by category, distance, or availability. Everything is hyperlocal.'
                },
                {
                  number: '3',
                  title: 'Send a borrow request',
                  description: 'Message the owner directly. Agree on dates and terms. All communication is in-app and encrypted for your safety.'
                },
                {
                  number: '4',
                  title: 'Pick up and return',
                  description: "Meet your neighbor, borrow the item, use it, and return it. Your trust score goes up with every successful exchange."
                },
              ].map((step, i) => (
                <Step key={step.number} {...step} delay={i * 0.1} />
              ))}
            </div>

            {/* Visual */}
            <motion.div
              variants={fadeIn}
              className="relative bg-card border border-border rounded-3xl p-8 shadow-card overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="space-y-4 relative z-10">
                {/* Mock item card */}
                <div className="bg-background border border-border rounded-xl p-4 shadow-soft">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">🔧</div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">DeWalt Power Drill</p>
                      <p className="text-xs text-muted-foreground">0.4km · Tools</p>
                    </div>
                    <span className="ml-auto text-xs font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-600">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">R</div>
                    <div>
                      <p className="text-xs font-medium text-foreground">Rahul M.</p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-accent text-accent" />)}
                      </div>
                    </div>
                    <Button size="sm" className="ml-auto h-7 text-xs px-3">Request</Button>
                  </div>
                </div>

                {/* Mock message */}
                <div className="bg-background border border-border rounded-xl p-4 shadow-soft space-y-2">
                  <p className="text-xs font-semibold text-foreground">💬 Request sent!</p>
                  <div className="bg-primary/10 rounded-lg px-3 py-2">
                    <p className="text-xs text-primary font-medium">"Hi Rahul! Can I borrow the drill this Saturday?"</p>
                  </div>
                  <div className="bg-green-500/10 rounded-lg px-3 py-2 ml-4">
                    <p className="text-xs text-green-700 font-medium">✓ Accepted! See you Saturday at 10am.</p>
                  </div>
                </div>

                {/* Trust score */}
                <div className="bg-background border border-border rounded-xl p-4 shadow-soft flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Trust Score: 4.9</p>
                    <p className="text-xs text-muted-foreground">Top 5% of neighbors in your area</p>
                  </div>
                  <div className="ml-auto text-2xl">🏆</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ═══ CATEGORIES ════════════════════════════════════════════════════ */}
      <Section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Everything your neighborhood has</h2>
            <p className="mt-3 text-muted-foreground text-lg">From power tools to party supplies — it's all nearby.</p>
          </motion.div>
          <motion.div variants={fadeUp} custom={1} className="flex flex-wrap justify-center gap-3">
            {[
              { icon: Wrench, label: 'Tools & DIY', color: '#f59e0b' },
              { icon: Laptop, label: 'Electronics', color: '#3b82f6' },
              { icon: ChefHat, label: 'Kitchen', color: '#ec4899' },
              { icon: Tent, label: 'Outdoor & Camping', color: '#10b981' },
              { icon: BookOpen, label: 'Books & Games', color: '#8b5cf6' },
              { icon: Bike, label: 'Sports & Fitness', color: '#f97316' },
              { icon: Package, label: 'Party & Events', color: '#06b6d4' },
              { icon: Heart, label: 'Baby & Kids', color: '#e11d48' },
            ].map(cat => <CategoryPill key={cat.label} {...cat} />)}
          </motion.div>
        </div>
      </Section>

      {/* ═══ FEATURES ══════════════════════════════════════════════════════ */}
      <Section id="features" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-sm font-semibold text-primary uppercase tracking-widest">Why LocalShare</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold text-foreground">Built for real neighborhoods</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin,
                title: 'Hyperlocal discovery',
                description: 'See items on an interactive map within your exact neighborhood. Filter by walking distance — no more driving across town.',
                color: '#10b981',
                delay: 0,
              },
              {
                icon: Shield,
                title: 'Trust & verification',
                description: 'Every user builds a reputation through verified exchanges. Trust scores, ratings, and community reviews keep everyone accountable.',
                color: '#3b82f6',
                delay: 0.1,
              },
              {
                icon: RefreshCw,
                title: 'Zero-waste sharing',
                description: 'Why let items collect dust? List what you own, borrow what you need. Every successful share reduces waste and saves resources.',
                color: '#f59e0b',
                delay: 0.2,
              },
              {
                icon: Users,
                title: 'Real-time messaging',
                description: 'Chat directly with neighbors inside the app. Coordinate pickup times, ask questions, and build genuine connections.',
                color: '#8b5cf6',
                delay: 0.3,
              },
              {
                icon: Zap,
                title: 'Instant notifications',
                description: 'Get real-time alerts when your borrow requests are accepted, when items become available, and for new messages.',
                color: '#ec4899',
                delay: 0.4,
              },
              {
                icon: Heart,
                title: 'Completely free',
                description: 'No subscription fees, no hidden charges. LocalShare is free for borrowers and lenders. We believe community should be accessible.',
                color: '#f97316',
                delay: 0.5,
              },
            ].map(feature => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ TESTIMONIALS ══════════════════════════════════════════════════ */}
      <Section id="testimonials" className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-sm font-semibold text-primary uppercase tracking-widest">Community voices</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold text-foreground">Neighbors love LocalShare</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "I needed a pressure washer for one afternoon. Instead of spending ₹8,000, I borrowed one from my neighbor for free. This app is changing how we think about ownership.",
                name: "Priya S.",
                role: "Homeowner, Bangalore",
                rating: 5,
                delay: 0,
              },
              {
                quote: "I had a DSLR sitting in my closet for years. Listed it on LocalShare, and now it's used by three different neighbors monthly. It feels great knowing it's not going to waste.",
                name: "Arjun M.",
                role: "Photographer, Hyderabad",
                rating: 5,
                delay: 0.1,
              },
              {
                quote: "As a new resident, LocalShare helped me meet my neighbors before I even moved all my boxes in. Borrowed a trolley, returned it, got invited for chai. Community is real here.",
                name: "Meera K.",
                role: "New resident, Pune",
                rating: 5,
                delay: 0.2,
              },
            ].map(t => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ FINAL CTA ══════════════════════════════════════════════════════ */}
      <Section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={fadeUp} custom={0}
            className="relative bg-card border border-border rounded-3xl p-12 shadow-card overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-3xl" />
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-accent/8 blur-3xl" />

            <div className="relative z-10 space-y-6">
              <Image src="/logo.png" alt="Local Share" width={48} height={48} className="rounded-xl mx-auto" unoptimized />
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Your neighborhood is<br />
                <span className="text-primary">waiting for you</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-xl mx-auto">
                Join thousands of neighbors who are already sharing, saving, and building community together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Button size="xl" onClick={handleCTA} className="group shadow-accent">
                  Join LocalShare Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="/auth">Sign in instead</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Free forever · No credit card required · Join in 30 seconds
              </p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══ FOOTER ═════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Local Share" width={28} height={28} className="rounded-lg" unoptimized />
              <span className="font-bold text-foreground">Local Share</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2026 Local Share · Built to strengthen neighborhoods · Free for everyone
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
              <Link href="/auth" className="hover:text-foreground transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
