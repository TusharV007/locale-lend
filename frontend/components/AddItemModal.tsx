import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, MapPin, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { addItem, updateItem } from '@/lib/db';
import { compressImage } from '@/lib/utils';
import { uploadImage } from '@/lib/storage';
import type { GeoJSONPoint, Item, ItemCategory } from '@/types';

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editItem?: Item | null; // When provided, switches to edit mode
}

const CATEGORIES: ItemCategory[] = ['Tools', 'Electronics', 'Kitchen', 'Outdoor', 'Books', 'Sports'];

export function AddItemModal({ isOpen, onClose, onSuccess, editItem = null }: AddItemModalProps) {
    const { user } = useAuth();
    const isEditMode = !!editItem;
    const [mounted, setMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCapturingLocation, setIsCapturingLocation] = useState(false);
    const [location, setLocation] = useState<GeoJSONPoint | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        category: ItemCategory;
        image: string;
        rentalPricePerDay: number;
    }>({
        title: '',
        description: '',
        category: 'Tools',
        image: '',
        rentalPricePerDay: 1,
    });

    // Pre-fill form when editing
    useEffect(() => {
        setMounted(true);
    }, []);

    // Pre-fill form when editing
    useEffect(() => {
        if (editItem) {
            setFormData({
                title: editItem.title || '',
                description: editItem.description || '',
                category: editItem.category || 'Tools',
                image: editItem.images?.[0] || '',
                rentalPricePerDay: (editItem as any).rentalPricePerDay || 1,
            });
            if (editItem.location) {
                setLocation(editItem.location);
            }
        } else {
            setFormData({ title: '', description: '', category: 'Tools', image: '', rentalPricePerDay: 1 });
            setLocation(null);
            setLocationError(null);
        }
    }, [editItem, isOpen]);

    const captureLocation = () => {
        if (typeof window === 'undefined' || !navigator?.geolocation) {
            setLocationError('Geolocation not supported');
            toast.error('Geolocation not supported by your browser');
            return;
        }
        setIsCapturingLocation(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ type: 'Point', coordinates: [longitude, latitude] });
                setIsCapturingLocation(false);
                toast.success('Location captured!');
            },
            (err) => {
                let errorMsg = 'Failed to get location';
                if (err.code === err.PERMISSION_DENIED) errorMsg = 'Location permission denied';
                else if (err.code === err.POSITION_UNAVAILABLE) errorMsg = 'Location unavailable';
                setLocationError(errorMsg);
                setIsCapturingLocation(false);
                toast.error(errorMsg);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const toastId = toast.loading('Processing image...');
            const compressedBase64 = await compressImage(file);
            toast.loading('Uploading...', { id: toastId });
            const res = await fetch(compressedBase64);
            const blob = await res.blob();
            const filename = `items/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const downloadURL = await uploadImage(blob, filename);
            setFormData(prev => ({ ...prev, image: downloadURL }));
            toast.success('Image uploaded!', { id: toastId });
        } catch (error) {
            toast.error('Failed to upload image');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (!formData.title || !formData.description) {
                throw new Error('Please fill all required fields');
            }
            if (!isEditMode && !formData.image) {
                throw new Error('Please upload an item image');
            }
            if (formData.rentalPricePerDay <= 0) {
                throw new Error('Rental price must be at least ₹1 per day');
            }

            const itemLocation: GeoJSONPoint = location || { type: 'Point' as const, coordinates: [80.4365, 16.3067] };

            if (isEditMode && editItem) {
                // Update existing item
                const updates: any = {
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    rentalPricePerDay: formData.rentalPricePerDay,
                };
                if (formData.image && formData.image !== editItem.images?.[0]) {
                    updates.images = [formData.image];
                }
                if (location) {
                    updates.location = itemLocation;
                }
                await updateItem(editItem.id, updates);
                toast.success('Item updated successfully!');
            } else {
                const ownerData: any = {
                    id: user?.uid || 'anonymous',
                    name: user?.displayName || 'Anonymous',
                    email: user?.email || '',
                    location: itemLocation,
                    address: 'Guntur, Andhra Pradesh',
                    trustScore: 5.0,
                    totalReviews: 0,
                    itemsLentCount: 0,
                    itemsBorrowedCount: 0,
                    memberSince: new Date(),
                    verified: true,
                };
                if (user?.photoURL) {
                    ownerData.avatar = user.photoURL;
                }

                // Create new item
                const newItem = {
                    ...formData,
                    ownerId: user?.uid || 'anonymous',
                    owner: ownerData,
                    availabilityStatus: 'Available' as const,
                    location: itemLocation,
                    distance: 0,
                    images: [formData.image],
                    borrowCount: 0,
                    rentalPricePerDay: formData.rentalPricePerDay,
                };
                await addItem(newItem);
                toast.success('Item listed successfully!');
            }

            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save item');
        } finally {
            setIsSubmitting(false);
        }
    };
    if (!mounted) return null;

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
                        className="relative w-full max-w-lg bg-card border rounded-xl shadow-lg z-10 flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b">
                            <div className="flex items-center gap-2">
                                {isEditMode
                                    ? <Pencil className="w-5 h-5 text-primary" />
                                    : <Plus className="w-5 h-5 text-primary" />}
                                <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Item' : 'List an Item'}</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="add-item-form" onSubmit={handleSubmit} className="space-y-4">
                                {/* Image */}
                                <div className="space-y-2">
                                    <Label htmlFor="image">Item Image{!isEditMode && ' *'}</Label>
                                    <div className="flex items-center gap-4">
                                        {formData.image && (
                                            <img src={formData.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg border" />
                                        )}
                                        <div className="relative">
                                            <input type="file" id="image" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                            <Button type="button" variant="outline" onClick={() => document.getElementById('image')?.click()}>
                                                <Upload className="w-4 h-4 mr-2" />
                                                {formData.image ? 'Change Image' : 'Upload Image'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Cordless Drill"
                                        required
                                    />
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <select
                                        id="category"
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as ItemCategory })}
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe your item, its condition, and any terms..."
                                        rows={3}
                                        required
                                    />
                                </div>

                                {/* Rental Price */}
                                <div className="space-y-2">
                                    <Label htmlFor="rentalPrice">Rental Price per Day (₹)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                        <Input
                                            id="rentalPrice"
                                            type="number"
                                            value={formData.rentalPricePerDay}
                                            onChange={e => setFormData({ ...formData, rentalPricePerDay: parseFloat(e.target.value) })}
                                            className="pl-7"
                                            placeholder="Enter amount"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Minimum price is ₹1 per day</p>
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <Label>Item Location</Label>
                                    <Button
                                        type="button"
                                        variant={location ? 'default' : 'outline'}
                                        onClick={captureLocation}
                                        disabled={isCapturingLocation}
                                        className="w-full"
                                    >
                                        <MapPin className="w-4 h-4 mr-2" />
                                        {isCapturingLocation ? 'Getting Location...' : location ? 'Location Set ✓' : 'Capture My Location'}
                                    </Button>
                                    {location && <p className="text-xs text-green-600">📍 Location captured successfully</p>}
                                    {locationError && <p className="text-xs text-red-600">{locationError}</p>}
                                    {!location && !locationError && (
                                        <p className="text-xs text-muted-foreground">
                                            {isEditMode ? 'Update your location or keep existing' : 'Capture location so borrowers can see distance'}
                                        </p>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t bg-secondary/20">
                            <Button type="submit" form="add-item-form" className="w-full" disabled={isSubmitting}>
                                {isSubmitting
                                    ? (isEditMode ? 'Saving...' : 'Listing...')
                                    : (isEditMode ? 'Save Changes' : 'List Item')}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
