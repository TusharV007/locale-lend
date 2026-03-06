"use client";

import { motion } from 'framer-motion';
import { Search, PlusCircle, MessageCircle, User, LogOut, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from '@/components/NotificationDropdown';

interface NavbarProps {
  className?: string;
  onAddItemClick?: () => void;
  onSearch?: (query: string) => void;
}

export function Navbar({ className, onAddItemClick, onSearch }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'sticky top-0 z-40 w-full bg-background/80 backdrop-blur-lg border-b border-border',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => router.push('/')}>
            <Image src="/logo.png" alt="Locale Lend Logo" width={40} height={40} className="rounded-xl object-cover" priority />
            <span className="text-xl font-bold text-foreground hidden sm:block">
              Locale <span className="text-primary">Lend</span>
            </span>
          </div>

          {/* Search Bar - Centered */}
          <div className="flex-1 max-w-md hidden md:block relative">
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.querySelector('input');
              if (input?.value.trim()) {
                router.push(`/search?q=${encodeURIComponent(input.value)}`);
              }
            }} className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search items..."
                className="w-full bg-secondary/50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                defaultValue={onSearch ? '' : undefined}
              />
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Removed 'Browse' as it's redundant with logo/home */}
            {[
              { icon: PlusCircle, label: 'List Item', active: false, onClick: onAddItemClick },
              { icon: MessageCircle, label: 'Messages', active: false, onClick: () => router.push('/messages') },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Search Icon (visible on small screens) */}
          <button className="md:hidden p-2 text-muted-foreground" onClick={() => {/* Toggle mobile search */ }}>
            <Search className="w-5 h-5" />
          </button>

          {/* ... User Actions */}
          <div className="flex items-center gap-3">
            {/* Real-time Notification Dropdown */}
            <NotificationDropdown />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                  <User className="w-5 h-5 text-secondary-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <Package className="mr-2 h-4 w-4" /> My Items
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/messages')}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <User className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
