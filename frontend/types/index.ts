// Local Share Type Definitions
// These types mirror what would be Mongoose schemas in a full-stack app

export type ItemCategory = 'Tools' | 'Electronics' | 'Kitchen' | 'Outdoor' | 'Books' | 'Gaming' | 'Board Games' | 'Sports' | 'Construction';

export type AvailabilityStatus = 'Available' | 'Borrowed' | 'Reserved' | 'Unavailable';

export type BookingStatus = 'Pending' | 'Active' | 'Completed' | 'Cancelled';

// GeoJSON Point type for location data
// In MongoDB, this would use 2dsphere indexing for geospatial queries
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude] - GeoJSON standard
}

// Bank details for payouts
export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  updatedAt: Date;
}

// User schema - represents a neighbor in the community
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  // GeoJSON Point for geospatial queries with $near operator
  location: GeoJSONPoint;
  address: string;
  // Trust Score: Weighted average of peer reviews (70%) and successful returns (30%)
  trustScore: number;
  totalReviews: number;
  itemsLentCount: number;
  itemsBorrowedCount: number;
  memberSince: Date;
  verified: boolean;
  bankDetails?: BankDetails;
  role?: 'admin' | 'user';
  isBlocked?: boolean;
  referralCode?: string;
  referredBy?: string;
  referralPoints?: number;
  referralCount?: number;
}

// Item schema - represents a shareable resource
export interface Item {
  id: string;
  ownerId: string;
  owner: User;
  title: string;
  description: string;
  category: ItemCategory;
  // GeoJSON Point for proximity search using MongoDB $near operator
  location: GeoJSONPoint;
  images: string[];
  availabilityStatus: AvailabilityStatus;
  // Distance in meters, calculated from geospatial query
  distance?: number;
  createdAt: Date;
  status: 'available' | 'lended' | 'unavailable';
  borrowCount: number;
  rentalPrice: number; // 0 = free sharing
  priceUnit: 'hour' | 'day';
}

// Booking schema - represents a lending transaction
export interface Request {
  id: string;
  itemId: string;
  item?: Item;
  borrowerId: string;
  borrower?: User;
  lenderId: string;
  lender?: User;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedDates: {
    start: Date;
    end: Date;
  };
  duration: number; // number of hours or days
  priceUnit: 'hour' | 'day';
  selectedPrice: number;
  message: string;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
  locationSharing?: {
    enabled: boolean;
    sharedLocation?: GeoJSONPoint;
    lastUpdated?: Date;
  };
}

// API Response types for geospatial queries
export interface NearbyItemsQuery {
  lat: number;
  lng: number;
  radius?: number; // Default: 2000 meters (2km)
  category?: ItemCategory;
}

export interface NearbyItemsResponse {
  items: Item[];
  total: number;
  radius: number;
  center: GeoJSONPoint;
}

export interface Payment {
  id: string;
  requestId: string;
  itemId: string;
  itemTitle: string;
  payerId: string;
  payerName: string;
  receiverId: string;
  receiverName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
}

// Review schema - represents a user rating and feedback
export interface Review {
  id: string;
  requestId: string; // The transaction this review relates to
  reviewerId: string;
  reviewerName: string;
  revieweeId: string; // The user receiving the review
  itemId: string;
  itemTitle: string;
  rating: number; // 1-5 stars
  comment?: string;
  createdAt: Date;
}

