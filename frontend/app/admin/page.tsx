"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, 
  Package, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  MapPin,
  Calendar
} from "lucide-react";
import { fetchAllUsers, fetchAllItemsAdmin } from "@/lib/db";
import { User, Item } from "@/types";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalItems: 0,
    activeRequests: 0,
    verifiedUsers: 0
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [users, items] = await Promise.all([
          fetchAllUsers(),
          fetchAllItemsAdmin()
        ]);

        setStats({
          totalUsers: users.length,
          totalItems: items.length,
          activeRequests: 0, // Need fetchRequests for this, skipping for simplicity now
          verifiedUsers: users.filter(u => u.verified).length
        });

        setRecentUsers(users.slice(0, 5));
        setRecentItems(items.slice(0, 5));
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "blue" },
    { label: "Total Items", value: stats.totalItems, icon: Package, color: "green" },
    { label: "Verified Users", value: stats.verifiedUsers, icon: ShieldCheck, color: "purple" },
    { label: "Platform Growth", value: "+12%", icon: TrendingUp, color: "orange" },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-white/5 rounded-3xl" />
          <div className="h-96 bg-white/5 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-gray-400 mt-1">Real-time snapshots of Locale-Lend community.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-[#1a1a1a] border border-white/5 p-6 rounded-3xl hover:border-blue-500/30 transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                <h3 className="text-3xl font-bold mt-2">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <section className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Users size={20} className="text-blue-500" />
              Newest Users
            </h2>
            <Link href="/admin/users" className="text-blue-500 text-sm hover:underline flex items-center gap-1">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentUsers.map((user) => (
              <div key={user.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{user.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {user.address || "No address"}</span>
                  </div>
                </div>
                <div className="text-right">
                   <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${user.verified ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}`}>
                    {user.verified ? "Verified" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Items */}
        <section className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Package size={20} className="text-green-500" />
              Recently Listed
            </h2>
            <Link href="/admin/items" className="text-green-500 text-sm hover:underline flex items-center gap-1">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentItems.map((item) => (
              <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center"><Package size={20} className="text-gray-500" /></div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-sm truncate">{item.title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold block">₹{item.rentalPricePerDay}</span>
                  <span className="text-[10px] text-gray-500">/ day</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
