"use client";

import React, { useEffect, useState } from "react";
import { 
  fetchUserProfile, 
  adminUpdateUser,
  adminDeleteUser,
  subscribeAllUsers 
} from "@/lib/db";
import { User } from "@/types";
import { ActionConfirmModal } from "@/components/ActionConfirmModal";
import { auth } from "@/lib/firebase";
import { RefreshCw, Search, Filter, MoreHorizontal, ShieldCheck, Ban, UserPlus, Mail, Edit2, Trash2, X, Check, UserCheck, Database } from "lucide-react";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks/useAsyncAction";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { performAction } = useAsyncAction();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    setLoading(true);
    try {
      unsubscribe = subscribeAllUsers((allUsers) => {
        setUsers(allUsers);
        setLoading(false);
      });
    } catch (err) {
      console.error("Failed to setup user subscription:", err);
      toast.error("Failed to load users");
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    try {
      await adminUpdateUser(userId, { verified: !currentStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified: !currentStatus } : u));
      toast.success(`User ${!currentStatus ? 'verified' : 'unverified'}`);
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole?: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await adminUpdateUser(userId, { role: newRole as any });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      toast.success(`User role updated to ${newRole}`);
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  const handleToggleBlock = async (userId: string, currentBlocked?: boolean) => {
    try {
      await adminUpdateUser(userId, { isBlocked: !currentBlocked });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: !currentBlocked } : u));
      toast.success(`User ${!currentBlocked ? 'blocked' : 'unblocked'}`);
    } catch (err) {
      toast.error("Failed to block/unblock user");
    }
  };

  const handleBulkSync = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in to sync users");
      return;
    }

    await performAction(
      async () => {
        setIsSyncing(true);
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/sync', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Sync failed');
        return data;
      },
      {
        successMessage: "User synchronization complete!",
        onSuccess: () => {}, // Handled by subscription
        onError: () => setIsSyncing(false),
      }
    );
    setIsSyncing(false);
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in to perform this action");
      return;
    }

    await performAction(
      async () => {
        setIsDeleting(true);
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/users/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId: deleteConfirmUser.id })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Purge failed');
        return data;
      },
      {
        successMessage: "User fully purged from system.",
        onSuccess: () => {
          setUsers(prev => prev.filter(u => u.id !== deleteConfirmUser.id));
          setDeleteConfirmUser(null);
        },
        onError: () => setIsDeleting(false),
      }
    );
    setIsDeleting(false);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    

    
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-gray-400 mt-1">Verify, promote, or manage community members.</p>
        </div>
        <button 
          onClick={handleBulkSync}
          disabled={isSyncing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} />
          <span>{isSyncing ? "Synchronizing..." : "Sync All Users"}</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4 bg-[#1a1a1a] p-4 rounded-3xl border border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..."
            className="w-full bg-[#111111] border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors text-gray-400">
          <Filter size={20} />
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-20 bg-white/5" />
                  </tr>
                ))
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-white">{u.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} /> {u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        u.verified ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      }`}>
                        {u.verified ? <Check size={10} /> : <div className="w-2 h-2 rounded-full bg-yellow-500" />} {u.verified ? "Verified" : "Unverified"}
                      </span>
                      {u.id.startsWith('neighbor-seed-') ? (
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit">
                            <Database size={8} /> Seeded Data
                         </span>
                      ) : (
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-green-500/10 text-green-400 border border-green-500/20 w-fit">
                            <UserCheck size={8} /> Registered
                         </span>
                      )}
                      {u.isBlocked && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                          <Ban size={10} /> Blocked
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-0.5 rounded-md ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400 font-bold' : 'text-gray-400'}`}>
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleToggleVerify(u.id, u.verified)}
                        className={`p-2 rounded-xl transition-all ${u.verified ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-green-500 hover:bg-green-500/10'}`}
                        title={u.verified ? "Unverify User" : "Verify User"}
                      >
                        <ShieldCheck size={18} />
                      </button>
                      <button 
                        onClick={() => handleToggleAdmin(u.id, u.role)}
                        className={`p-2 rounded-xl transition-all ${u.role === 'admin' ? 'text-gray-400 hover:bg-white/10' : 'text-blue-500 hover:bg-blue-500/10'}`}
                        title={u.role === 'admin' ? "Demote to User" : "Make Admin"}
                      >
                        <UserPlus size={18} />
                      </button>
                      <button 
                         onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                         className={`p-2 rounded-xl transition-all ${u.isBlocked ? 'text-green-500 hover:bg-green-500/10' : 'text-red-500 hover:bg-red-500/10'}`}
                          title={u.isBlocked ? "Unblock User" : "Block User"}
                        >
                        <Ban size={18} />
                      </button>
                      <button 
                         onClick={() => setDeleteConfirmUser(u)}
                         className="p-2 rounded-xl transition-all text-red-500 hover:bg-red-500/10 lg:opacity-0 lg:group-hover:opacity-100"
                         title="Delete User"
                       >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredUsers.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No users found matching your search.
            </div>
          )}
        </div>
      </div>

      <ActionConfirmModal
        isOpen={!!deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        onConfirm={handleDeleteUser}
        title="Delete User?"
        description={`This will permanently delete ${deleteConfirmUser?.name}'s account and all their listed items. This action cannot be undone.`}
        confirmText="Delete Permanently"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
