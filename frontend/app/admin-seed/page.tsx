"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { adminUpdateUser } from "@/lib/db";
import { ShieldCheck, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminSeedPage() {
  const { user, loading } = useAuth();
  const [isPromoting, setIsPromoting] = useState(false);
  const router = useRouter();

  const handlePromote = async () => {
    if (!user) {
      toast.error("Please log in first");
      return;
    }

    try {
      setIsPromoting(true);
      await adminUpdateUser(user.uid, { role: 'admin' });
      toast.success("Congratulations! You are now an Admin.");
      
      // We need to trigger a refresh of the auth state
      window.location.href = "/admin"; // Full reload to force AuthContext to re-fetch
    } catch (err) {
      console.error(err);
      toast.error("Failed to promote user");
    } finally {
      setIsPromoting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#111111] border border-white/10 rounded-[2rem] p-10 text-center shadow-2xl relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-blue-500">
          <ShieldAlert size={40} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight">Access Admin Rights</h1>
        <p className="text-gray-400 mt-4 leading-relaxed">
          This is a temporary setup page to grant your account administrative privileges. 
          Use this only for initial setup or development.
        </p>

        {user ? (
          <div className="mt-10 space-y-6">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-left">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Target Account</p>
              <p className="text-lg font-medium mt-1">{user.displayName || "Unknown User"}</p>
              <p className="text-sm text-gray-400">{user.email}</p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold border border-blue-500/20">
                Current Role: {user.role || 'user'}
              </div>
            </div>

            <button
              onClick={handlePromote}
              disabled={isPromoting || user.role === 'admin'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 group"
            >
              {isPromoting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : user.role === 'admin' ? (
                <><ShieldCheck size={20} /> Already Admin</>
              ) : (
                <>Promote to Admin <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
            <p className="text-[10px] text-gray-500">Security Warning: Delete this page after use in production.</p>
          </div>
        ) : (
          <div className="mt-10">
             <button 
               onClick={() => router.push('/auth')}
               className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-2xl transition-all border border-white/10"
             >
               Go to Login
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
