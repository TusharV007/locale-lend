"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { adminUpdateUser } from "@/lib/db";

interface AddMissingUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMissingUserModal({ isOpen, onClose, onSuccess }: AddMissingUserModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !uid) {
      toast.error("All fields are required");
      return;
    }

    setIsSubmitting(true);
    try {
      // Mirror the user from Auth to Firestore
      await adminUpdateUser(uid.trim(), {
        name: name.trim(),
        email: email.trim(),
        verified: false,
        trustScore: 0,
        totalReviews: 0,
        itemsLentCount: 0,
        itemsBorrowedCount: 0,
        memberSince: new Date(),
        role: email.trim() === 'admin@gmail.com' ? 'admin' : 'user'
      });
      
      toast.success("Neighbor record mirrored successfully!");
      onSuccess();
      onClose();
      // Reset form
      setEmail("");
      setName("");
      setUid("");
    } catch (err) {
      toast.error("Failed to mirror neighbor record");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-[2rem] shadow-2xl z-10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-white/5 bg-gradient-to-br from-blue-600/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/20 rounded-2xl">
                    <UserPlus className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Mirror Neighbor</h2>
                    <p className="text-xs text-gray-400 mt-1">Add a missing Firestore profile for an Auth user.</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex gap-3">
                 <Info className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                 <p className="text-[11px] text-yellow-500/80 leading-relaxed">
                   Copy the <b>UID</b> and <b>Email</b> directly from your Firebase Authentication console to ensure the records match exactly.
                 </p>
              </div>

              <form id="sync-user-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sync-uid" className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Firebase UID</Label>
                  <Input
                    id="sync-uid"
                    value={uid}
                    onChange={e => setUid(e.target.value)}
                    placeholder="Paste UID from console..."
                    className="h-12 bg-black/20 border-white/10 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sync-email" className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Email Address</Label>
                  <Input
                    id="sync-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="neighbor@example.com"
                    className="h-12 bg-black/20 border-white/10 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sync-name" className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Full Name</Label>
                  <Input
                    id="sync-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                    className="h-12 bg-black/20 border-white/10 focus:border-blue-500 rounded-xl"
                  />
                </div>
              </form>
            </div>

            <div className="p-8 border-t border-white/5 bg-black/20 flex gap-4">
               <Button 
                variant="ghost" 
                onClick={onClose} 
                className="flex-1 h-12 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
               >
                 Cancel
               </Button>
               <Button 
                type="submit" 
                form="sync-user-form" 
                className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                disabled={isSubmitting}
               >
                 {isSubmitting ? 'Syncing...' : 'Mirror Record'}
               </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
