"use client";

import React, { useEffect, useState } from "react";
import { fetchAllItemsAdmin, adminDeleteItem } from "@/lib/db";
import { Item } from "@/types";
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  Package, 
  Tag, 
  AlertCircle,
  Eye,
  MapPin,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ActionConfirmModal } from "@/components/ActionConfirmModal";
import { AddItemModal } from "@/components/AddItemModal";
import { RefreshCw, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ItemManagement() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, title: string} | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems(isManualRefresh = false) {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);
      
      const allItems = await fetchAllItemsAdmin();
      setItems(allItems);
      if (isManualRefresh) toast.success("Inventory updated");
    } catch (err) {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  const handleDeleteItem = (itemId: string, title: string) => {
    setItemToDelete({ id: itemId, title });
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await adminDeleteItem(itemToDelete.id);
      setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
      toast.success("Item deleted successfully");
    } catch (err) {
      toast.error("Failed to delete item");
    } finally {
      setIsConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setIsAddModalOpen(true);
  };



  const filteredItems = items.filter(i => 
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community Inventory</h1>
          <p className="text-gray-400 mt-1">Monitor and moderate all items listed across the platform.</p>
        </div>
        <Button 
          onClick={() => loadItems(true)}
          disabled={isRefreshing}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 h-12 font-bold shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={18} className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Updating..." : "Update Item List"}
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4 bg-[#1a1a1a] p-4 rounded-3xl border border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by title or category..."
            className="w-full bg-[#111111] border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Items Grid/List */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
         <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Status</th>
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
              ) : filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.title} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center"><Package size={20} className="text-gray-500" /></div>
                      )}
                      <div className="max-w-[200px]">
                        <div className="font-bold text-sm text-white truncate">{item.title}</div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-1 uppercase tracking-tighter"><Clock size={10} /> Added {new Date(item.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Tag size={12} className="text-blue-500" />
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">{item.owner?.name || "Unknown"}</div>
                    <div className="text-xs text-gray-500">ID: {item.owner?.id?.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                      item.status === 'available' ? "bg-green-500/10 text-green-400 border-green-500/20" : 
                      item.status === 'lended' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : 
                      "bg-gray-500/10 text-gray-400 border-gray-500/20"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link 
                        href={`/search?item=${item.id}`} // assuming this goes to detail
                        target="_blank"
                        className="p-2 text-gray-400 hover:bg-white/10 rounded-xl transition-all"
                        title="View Live"
                      >
                        <Eye size={18} />
                      </Link>
                      <button 
                        onClick={() => handleEditItem(item)}
                        className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"
                        title="Edit Item"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Delete Item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredItems.length === 0 && (
            <div className="p-12 text-center text-gray-400">
               <AlertCircle size={40} className="mx-auto text-gray-600 mb-2" />
               <p>No listings found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      <ActionConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Marketplace Listing?"
        description={`Are you sure you want to remove "${itemToDelete?.title}"? All associated borrow requests and chats will be permanently deleted.`}
        confirmText="Delete Globally"
        variant="destructive"
      />

      <AddItemModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadItems}
        editItem={editingItem}
        adminMode={true}
      />
    </div>
  );
}
