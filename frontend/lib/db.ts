import { db, auth } from "./firebase";
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    type DocumentData,
    type QueryDocumentSnapshot,
    or,
    onSnapshot,
    deleteDoc,
    startAfter,
    writeBatch,
    setDoc,
} from "firebase/firestore";
import type { Item, GeoJSONPoint, Payment, Request, User, Review } from "@/types";
import { calculateTrustScore } from "./trustEngine";

const ITEMS_COLLECTION = "items";
const REQUESTS_COLLECTION = "requests";
const MESSAGES_SUBCOLLECTION = "messages";
const NOTIFICATIONS_COLLECTION = "notifications";
const PAYMENTS_COLLECTION = "payments";
const REVIEWS_COLLECTION = "reviews";
const USERS_COLLECTION = "users";

// Helper to safely parse any date format (Timestamp, Date, number, or string) from Firestore
function parseDate(val: any): Date {
    if (!val) return new Date();
    if (typeof val.toDate === 'function') return val.toDate();
    if (val instanceof Date) return val;
    if (typeof val === 'number') return new Date(val);
    try {
        return new Date(val);
    } catch (e) {
        return new Date();
    }
}

/**
 * Securely update user stats via API route (Trust Score, Points, etc.)
 * This circumvents strict Firestore rules while maintaining security.
 */
async function secureUpdateUserStats(targetUserId: string, updates: any, reason: string) {
    try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("Authentication required for stats update");

        const response = await fetch('/api/users/update-stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ targetUserId, updates, reason })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update user stats');
        }

        return await response.json();
    } catch (error) {
        console.error(`Secure update failed (${reason}):`, error);
        throw error;
    }
}

// ============================================
// ITEM FUNCTIONS
// ============================================

export const addItem = async (item: Omit<Item, "id" | "createdAt" | "distance" | "status" | "borrowCount">) => {
    try {
        const docRef = await addDoc(collection(db, ITEMS_COLLECTION), {
            ...item,
            createdAt: Timestamp.now(),
            distance: 0,
            borrowCount: 0,
            status: 'available'
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding item:", error);
        throw error;
    }
};

export const updateItem = async (
    itemId: string,
    fields: Partial<{ title: string; description: string; category: string; images: string[]; rentalPricePerDay: number; location: GeoJSONPoint }>
) => {
    try {
        const docRef = doc(db, ITEMS_COLLECTION, itemId);
        await updateDoc(docRef, fields);
    } catch (error) {
        console.error("Error updating item:", error);
        throw error;
    }
};

export const updateItemStatus = async (itemId: string, status: 'available' | 'lended' | 'unavailable') => {
    try {
        const docRef = doc(db, ITEMS_COLLECTION, itemId);
        await updateDoc(docRef, { status });
    } catch (error) {
        console.error("Error updating item status:", error);
        throw error;
    }
};

/**
 * Cascade delete an item along with all related requests and messages using a Batch
 */
export const deleteItem = async (itemId: string, userId: string) => {
    try {
        console.log(`Starting atomic cascade delete for item: ${itemId}`);
        const requestsQuery = query(collection(db, REQUESTS_COLLECTION), where("itemId", "==", itemId), where("lenderId", "==", userId));
        const requestsSnapshot = await getDocs(requestsQuery);

        const batch = writeBatch(db);
        
        for (const requestDoc of requestsSnapshot.docs) {
            const messagesRef = collection(db, REQUESTS_COLLECTION, requestDoc.id, MESSAGES_SUBCOLLECTION);
            const messagesSnapshot = await getDocs(messagesRef);
            messagesSnapshot.docs.forEach(msgDoc => {
                batch.delete(msgDoc.ref);
            });
            batch.delete(requestDoc.ref);
        }

        const itemRef = doc(db, ITEMS_COLLECTION, itemId);
        batch.delete(itemRef);

        await batch.commit();
        console.log(`Successfully atomically deleted item: ${itemId}`);
    } catch (error) {
        console.error("Error in atomic cascade delete:", error);
        throw error;
    }
};

// Cursor-based pagination result
export interface PaginatedItems {
    items: Item[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
}

export const fetchItems = async (
    limitCount = 12,
    searchQuery = '',
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<PaginatedItems> => {
    try {
        let q;
        // If searching, we fetch a larger batch and filter locally to enable case-insensitive partial matches
        const fetchLimit = searchQuery ? 100 : limitCount;

        if (lastDoc) {
            q = query(
                collection(db, ITEMS_COLLECTION),
                orderBy("createdAt", "desc"),
                startAfter(lastDoc),
                limit(fetchLimit)
            );
        } else {
            q = query(
                collection(db, ITEMS_COLLECTION),
                orderBy("createdAt", "desc"),
                limit(fetchLimit)
            );
        }

        const querySnapshot = await getDocs(q);
        let items = querySnapshot.docs.map(d => {
            const data = d.data();
            return { id: d.id, ...data, createdAt: parseDate(data.createdAt) } as Item;
        });

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            items = items.filter(item => 
                item.title.toLowerCase().includes(lowerQuery) || 
                (item.description && item.description.toLowerCase().includes(lowerQuery))
            );
            // Truncate to limit count
            items = items.slice(0, limitCount);
        }

        const newLastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

        return { items, lastDoc: newLastDoc, hasMore: querySnapshot.docs.length === fetchLimit };
    } catch (error) {
        console.error("Error fetching items:", error);
        if ((error as any)?.code === 'failed-precondition') {
            console.warn("Missing index, fetching without sort");
            const fallbackQ = query(collection(db, ITEMS_COLLECTION), limit(limitCount));
            const snap = await getDocs(fallbackQ);
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Item));
            const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
            return { items, lastDoc: newLastDoc, hasMore: snap.docs.length === limitCount };
        }
        throw error;
    }
};

export interface PaginatedUserItems {
    items: Item[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
}

export const fetchUserItems = async (
    userId: string,
    limitCount = 20,
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<PaginatedUserItems> => {
    try {
        let q;
        if (lastDoc) {
            q = query(
                collection(db, ITEMS_COLLECTION),
                where("owner.id", "==", userId),
                orderBy("createdAt", "desc"),
                startAfter(lastDoc),
                limit(limitCount)
            );
        } else {
            q = query(
                collection(db, ITEMS_COLLECTION),
                where("owner.id", "==", userId),
                orderBy("createdAt", "desc"),
                limit(limitCount)
            );
        }
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(d => ({
            id: d.id, ...d.data(), createdAt: parseDate(d.data().createdAt)
        } as Item));
        const newLastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;
        return { items, lastDoc: newLastDoc, hasMore: querySnapshot.docs.length === limitCount };
    } catch (error) {
        console.error("Error fetching user items:", error);
        // Fallback without orderBy if composite index is missing
        try {
            const fallbackQ = query(collection(db, ITEMS_COLLECTION), where("owner.id", "==", userId), limit(limitCount));
            const snap = await getDocs(fallbackQ);
            const items = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: parseDate(d.data().createdAt) } as Item));
            const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
            return { items, lastDoc: newLastDoc, hasMore: snap.docs.length === limitCount };
        } catch (e) {
            throw e;
        }
    }
};

// ============================================
// REQUEST FUNCTIONS
// ============================================

export interface RequestData {
    id: string;
    itemId: string;
    itemTitle: string;
    borrowerId: string;
    borrowerName: string;
    lenderId: string;
    lenderName: string;
    message: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed';
    paymentStatus?: 'unpaid' | 'paid';
    rentalPricePerDay?: number;
    rentalDays?: number;
    createdAt: Date;
}

export const createRequest = async (request: Omit<RequestData, "id" | "createdAt" | "status" | "paymentStatus">) => {
    try {
        const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), {
            ...request,
            status: 'pending',
            paymentStatus: 'unpaid',
            createdAt: Timestamp.now()
        });

        // 1. Notify lender via in-app notification
        await createNotification({
            userId: request.lenderId,
            type: 'new_request',
            title: 'New Borrow Request',
            message: `${request.borrowerName} wants to borrow "${request.itemTitle}"`,
            requestId: docRef.id,
            itemTitle: request.itemTitle,
        });

        // 2. Notify lender via Professional Email (Resend)
        try {
            const lenderProfile = await fetchUserProfile(request.lenderId);
            if (lenderProfile?.email) {
                const amount = (request.rentalPricePerDay || 0) * (request.rentalDays || 1);
                await fetch('/api/emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'NEW_REQUEST',
                        payload: {
                            to: lenderProfile.email,
                            borrowerName: request.borrowerName,
                            itemTitle: request.itemTitle,
                            requestId: docRef.id,
                            amount
                        }
                    })
                });
            }
        } catch (emailErr) {
            console.warn("Email notification failed:", emailErr);
        }

        return docRef.id;
    } catch (error) {
        console.error("Error creating request:", error);
        throw error;
    }
};

export const fetchUserRequests = async (userId: string): Promise<RequestData[]> => {
    try {
        const q = query(
            collection(db, REQUESTS_COLLECTION),
            or(where("borrowerId", "==", userId), where("lenderId", "==", userId)),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(d => {
            const data = d.data();
            return { id: d.id, ...data, createdAt: parseDate(data.createdAt) } as RequestData;
        });
    } catch (error) {
        console.error("Error fetching requests:", error);
        if ((error as any)?.code === 'failed-precondition') {
            const qSimplified = query(
                collection(db, REQUESTS_COLLECTION),
                or(where("borrowerId", "==", userId), where("lenderId", "==", userId))
            );
            const snap = await getDocs(qSimplified);
            return snap.docs.map(d => ({
                id: d.id, ...d.data(), createdAt: parseDate(d.data().createdAt)
            } as RequestData));
        }
        throw error;
    }
};

export const updateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected' | 'completed') => {
    try {
        const docRef = doc(db, REQUESTS_COLLECTION, requestId);
        await updateDoc(docRef, { status });

        // Fetch request data to build notification
        const requestDoc = await getDoc(docRef);
        if (requestDoc.exists()) {
            const requestData = requestDoc.data();
            const itemId = requestData.itemId;

            // Increment borrowCount on accept
            if (status === 'accepted' && itemId) {
                const itemRef = doc(db, ITEMS_COLLECTION, itemId);
                const itemDoc = await getDoc(itemRef);
                if (itemDoc.exists()) {
                    const currentCount = itemDoc.data().borrowCount || 0;
                    await updateDoc(itemRef, { borrowCount: currentCount + 1, status: 'lended' });
                }
            }

            // Restore item status on complete
            if (status === 'completed' && itemId) {
                 const itemRef = doc(db, ITEMS_COLLECTION, itemId);
                 await updateDoc(itemRef, { status: 'available' });
            }

            // Notify borrower
            if (status === 'accepted' || status === 'rejected') {
                // 1. In-app Notification
                await createNotification({
                    userId: requestData.borrowerId,
                    type: status === 'accepted' ? 'request_accepted' : 'request_rejected',
                    title: status === 'accepted' ? '🎉 Request Accepted!' : 'Request Rejected',
                    message: status === 'accepted'
                        ? `Your request for "${requestData.itemTitle}" was accepted by ${requestData.lenderName}. Please complete payment.`
                        : `Your request for "${requestData.itemTitle}" was declined by ${requestData.lenderName}.`,
                    requestId,
                    itemTitle: requestData.itemTitle,
                });

                // 2. Professional Email Notification (Resend)
                try {
                    const borrowerProfile = await fetchUserProfile(requestData.borrowerId);
                    if (borrowerProfile?.email) {
                        await fetch('/api/emails', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'REQUEST_STATUS_UPDATE',
                                payload: {
                                    to: borrowerProfile.email,
                                    status: status,
                                    lenderName: requestData.lenderName,
                                    itemTitle: requestData.itemTitle,
                                    requestId: requestId
                                }
                            })
                        });
                    }
                } catch (emailErr) {
                    console.warn("Status update email failed:", emailErr);
                }
            } else if (status === 'completed') {
                // Reward both users via secure API to avoid rule restrictions
                await secureUpdateUserStats(requestData.lenderId, {
                    referralPoints: (requestData.lenderPoints || 0) + 20,
                    itemsLentCount: (requestData.lenderLents || 0) + 1
                }, "Transaction completed (Lender)");
                
                await secureUpdateUserStats(requestData.borrowerId, {
                    referralPoints: (requestData.borrowerPoints || 0) + 10,
                    itemsBorrowedCount: (requestData.borrowerBorrows || 0) + 1
                }, "Transaction completed (Borrower)");
            }
        }
    } catch (error) {
        console.error("Error updating request status:", error);
        throw error;
    }
};

// ============================================
// LENDING / BORROWING HISTORY FUNCTIONS
// ============================================

export interface HistoryItem {
    requestId: string;
    itemId: string;
    itemTitle: string;
    itemImage?: string;
    otherPartyId: string;
    otherPartyName: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed';
    paymentStatus?: 'unpaid' | 'paid';
    rentalPricePerDay?: number;
    rentalDays?: number;
    createdAt: Date;
}

export const fetchUserLendingHistory = async (userId: string): Promise<HistoryItem[]> => {
    try {
        const q = query(
            collection(db, REQUESTS_COLLECTION),
            where("lenderId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(50)
        );
        const snapshot = await getDocs(q);
        const results: HistoryItem[] = [];

        for (const d of snapshot.docs) {
            const data = d.data();
            // Fetch item image
            let itemImage: string | undefined;
            try {
                const itemDoc = await getDoc(doc(db, ITEMS_COLLECTION, data.itemId));
                if (itemDoc.exists()) {
                    itemImage = itemDoc.data().images?.[0];
                }
            } catch { /* ignore */ }

            results.push({
                requestId: d.id,
                itemId: data.itemId,
                itemTitle: data.itemTitle,
                itemImage,
                otherPartyId: data.borrowerId,
                otherPartyName: data.borrowerName,
                status: data.status,
                paymentStatus: data.paymentStatus,
                rentalPricePerDay: data.rentalPricePerDay,
                rentalDays: data.rentalDays,
                createdAt: parseDate(data.createdAt),
            });
        }
        return results;
    } catch (error) {
        console.error("Error fetching lending history:", error);
        // Fallback without orderBy
        try {
            const q2 = query(collection(db, REQUESTS_COLLECTION), where("lenderId", "==", userId), limit(50));
            const snap = await getDocs(q2);
            return snap.docs.map(d => {
                const data = d.data();
                return {
                    requestId: d.id, itemId: data.itemId, itemTitle: data.itemTitle,
                    otherPartyId: data.borrowerId, otherPartyName: data.borrowerName, status: data.status,
                    paymentStatus: data.paymentStatus, rentalPricePerDay: data.rentalPricePerDay, rentalDays: data.rentalDays,
                    createdAt: parseDate(data.createdAt)
                } as HistoryItem;
            });
        } catch (e) {
            throw e;
        }
    }
};

export const fetchUserBorrowingHistory = async (userId: string): Promise<HistoryItem[]> => {
    try {
        const q = query(
            collection(db, REQUESTS_COLLECTION),
            where("borrowerId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(50)
        );
        const snapshot = await getDocs(q);
        const results: HistoryItem[] = [];

        for (const d of snapshot.docs) {
            const data = d.data();
            let itemImage: string | undefined;
            try {
                const itemDoc = await getDoc(doc(db, ITEMS_COLLECTION, data.itemId));
                if (itemDoc.exists()) {
                    itemImage = itemDoc.data().images?.[0];
                }
            } catch { /* ignore */ }

            results.push({
                requestId: d.id,
                itemId: data.itemId,
                itemTitle: data.itemTitle,
                itemImage,
                otherPartyId: data.lenderId,
                otherPartyName: data.lenderName,
                status: data.status,
                paymentStatus: data.paymentStatus,
                rentalPricePerDay: data.rentalPricePerDay,
                rentalDays: data.rentalDays,
                createdAt: parseDate(data.createdAt),
            });
        }
        return results;
    } catch (error) {
        console.error("Error fetching borrowing history:", error);
        try {
            const q2 = query(collection(db, REQUESTS_COLLECTION), where("borrowerId", "==", userId), limit(50));
            const snap = await getDocs(q2);
            return snap.docs.map(d => {
                const data = d.data();
                return {
                    requestId: d.id, itemId: data.itemId, itemTitle: data.itemTitle,
                    otherPartyId: data.lenderId, otherPartyName: data.lenderName, status: data.status,
                    paymentStatus: data.paymentStatus, rentalPricePerDay: data.rentalPricePerDay, rentalDays: data.rentalDays,
                    createdAt: parseDate(data.createdAt)
                } as HistoryItem;
            });
        } catch (e) {
            throw e;
        }
    }
};

// ============================================
// CHAT / MESSAGE FUNCTIONS
// ============================================

export interface Message {
    id: string;
    requestId: string;
    senderId: string;
    content: string;
    createdAt: Date;
}

export const sendMessage = async (requestId: string, senderId: string, content: string) => {
    try {
        const messagesRef = collection(db, REQUESTS_COLLECTION, requestId, MESSAGES_SUBCOLLECTION);
        await addDoc(messagesRef, { requestId, senderId, content, createdAt: Timestamp.now() });

        // Fetch parent request to determine recipient
        const requestDoc = await getDoc(doc(db, REQUESTS_COLLECTION, requestId));
        if (requestDoc.exists()) {
            const requestData = requestDoc.data();
            
            const isSenderLender = senderId === requestData.lenderId;
            const recipientId = isSenderLender ? requestData.borrowerId : requestData.lenderId;
            const senderName = isSenderLender ? requestData.lenderName : requestData.borrowerName;

            // Notify the recipient (preventing any undefined fields which crash Firestore)
            await createNotification({
                userId: recipientId || 'unknown',
                type: 'new_message',
                title: 'New Message 💬',
                message: `${(senderName || 'User').split(' ')[0]}: "${content.length > 50 ? content.slice(0, 50) + '...' : content}"`,
                requestId: requestId,
                itemTitle: requestData.itemTitle || 'Unknown Item',
            });
        }
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

export const subscribeToMessages = (requestId: string, callback: (messages: Message[]) => void) => {
    const messagesRef = collection(db, REQUESTS_COLLECTION, requestId, MESSAGES_SUBCOLLECTION);
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(d => ({
            id: d.id, ...d.data(), createdAt: parseDate(d.data().createdAt)
        } as Message));
        callback(messages);
    });
};

// ============================================
// PAYMENT FUNCTIONS
// ============================================

export const createPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'status'>) => {
    try {
        const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
            ...payment,
            status: 'paid',
            currency: 'INR',
            createdAt: Timestamp.now()
        });
        // Update request paymentStatus
        const requestRef = doc(db, REQUESTS_COLLECTION, payment.requestId);
        await updateDoc(requestRef, { paymentStatus: 'paid' });
        return docRef.id;
    } catch (error) {
        console.error("Error creating payment:", error);
        throw error;
    }
};

export const fetchUserPayments = async (userId: string): Promise<Payment[]> => {
    try {
        const q = query(
            collection(db, PAYMENTS_COLLECTION),
            or(where("payerId", "==", userId), where("receiverId", "==", userId)),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({
            id: d.id, ...d.data(), createdAt: parseDate(d.data().createdAt)
        } as Payment));
    } catch (error) {
        console.error("Error fetching payments:", error);
        return [];
    }
};

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

export interface NotificationData {
    id: string;
    userId: string;
    type: 'new_request' | 'request_accepted' | 'request_rejected' | 'new_message';
    title: string;
    message: string;
    requestId: string;
    itemTitle: string;
    read: boolean;
    createdAt: Date;
}

export const createNotification = async (data: Omit<NotificationData, 'id' | 'read' | 'createdAt'>, retryCount = 0) => {
    try {
        await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
            ...data,
            read: false,
            createdAt: Timestamp.now()
        });
    } catch (error) {
        console.error(`Error creating notification (attempt ${retryCount + 1}):`, error);
        // Retry logic for non-critical notifications if they fail due to transient network issues
        if (retryCount < 2) {
            setTimeout(() => createNotification(data, retryCount + 1), 2000);
        }
    }
};

export const subscribeToNotifications = (
    userId: string,
    callback: (notifications: NotificationData[]) => void
) => {
    const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(20)
    );
    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(d => ({
            id: d.id, ...d.data(), createdAt: parseDate(d.data().createdAt)
        } as NotificationData));
        callback(notifications);
    }, (error) => {
        console.error("Notification subscription error:", error);
    });
};

export const markAllNotificationsRead = async (userId: string) => {
    try {
        const q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where("userId", "==", userId),
            where("read", "==", false)
        );
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.update(d.ref, { read: true }));
        await batch.commit();
    } catch (error) {
        console.error("Error marking notifications read:", error);
    }
};

// ============================================
// LOCATION SHARING FUNCTIONS
// ============================================

export const enableLocationSharing = async (requestId: string) => {
    try {
        const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
        await updateDoc(requestRef, {
            'locationSharing.enabled': true,
            'locationSharing.lastUpdated': Timestamp.now()
        });
    } catch (error) {
        console.error('Error enabling location sharing:', error);
        throw error;
    }
};

export const updateSharedLocation = async (requestId: string, location: GeoJSONPoint) => {
    try {
        const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
        await updateDoc(requestRef, {
            'locationSharing.sharedLocation': location,
            'locationSharing.lastUpdated': Timestamp.now()
        });
    } catch (error) {
        console.error('Error updating shared location:', error);
        throw error;
    }
};

export const disableLocationSharing = async (requestId: string) => {
    try {
        const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
        await updateDoc(requestRef, {
            'locationSharing.enabled': false,
            'locationSharing.sharedLocation': null
        });
    } catch (error) {
        console.error('Error disabling location sharing:', error);
        throw error;
    }
};

// ============================================
// REVIEW FUNCTIONS
// ============================================

export const createReview = async (review: Omit<Review, "id" | "createdAt">) => {
    try {
        const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
            ...review,
            createdAt: Timestamp.now()
        });

        // Update user stats and notify - wrap in try-catch to avoid blocking the main review submission
        try {
            // 1. Fetch user to update their stats
            const userRef = doc(db, USERS_COLLECTION, review.revieweeId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                
                // 2. Fetch all reviews for this user to get exact average
                const allReviewsQ = query(collection(db, REVIEWS_COLLECTION), where("revieweeId", "==", review.revieweeId));
                const allReviewsSnap = await getDocs(allReviewsQ);
                
                let totalRating = 0;
                allReviewsSnap.docs.forEach(d => {
                    totalRating += d.data().rating;
                });
                const newTotalReviews = allReviewsSnap.docs.length;
                const newAverageRating = totalRating / newTotalReviews;

                // 3. Re-calculate Trust Score
                const trustResult = calculateTrustScore({
                    averageReviewRating: newAverageRating,
                    totalReviews: newTotalReviews,
                    successfulReturns: userData.itemsBorrowedCount || 0,
                    totalBorrowings: userData.itemsBorrowedCount || 0,
                    successfulLends: userData.itemsLentCount || 0,
                    totalLendings: userData.itemsLentCount || 0,
                    isVerified: userData.verified || false,
                    accountAgeDays: Math.floor((new Date().getTime() - parseDate(userData.memberSince).getTime()) / (1000 * 3600 * 24)) || 0,
                });

                // 4. Update the user record via Secure API
                await secureUpdateUserStats(review.revieweeId, {
                    totalReviews: newTotalReviews,
                    trustScore: trustResult.score,
                }, `Review from ${review.reviewerName}`);

                // Reward reviewee/reviewer
                await updateReferralPoints(review.reviewerId, 5, `Left a review for ${review.itemTitle}`);
            }
        } catch (error: any) {
            console.error("Error updating user stats after review via API:", error);
        }

        // Notify reviewee
        try {
            await createNotification({
                userId: review.revieweeId,
                type: 'request_accepted', // Using an existing type for now
                title: 'New Review Received! ⭐',
                message: `${review.reviewerName} left you a ${review.rating}-star review for "${review.itemTitle}".`,
                requestId: review.requestId,
                itemTitle: review.itemTitle,
            });
        } catch (subErr) {
            console.warn("Review stats update or notification failed, but review was saved:", subErr);
        }

        return docRef.id;
    } catch (error) {
        console.error("Error creating review:", error);
        throw error;
    }
};

export const fetchUserReviews = async (userId: string): Promise<Review[]> => {
    try {
        const q = query(
            collection(db, REVIEWS_COLLECTION),
            where("revieweeId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(d => {
            const data = d.data();
            return { id: d.id, ...data, createdAt: parseDate(data.createdAt) } as Review;
        });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        // Fallback without orderBy
        try {
            const fallbackQ = query(
                collection(db, REVIEWS_COLLECTION),
                where("revieweeId", "==", userId)
            );
            const snap = await getDocs(fallbackQ);
            return snap.docs.map(d => ({
                id: d.id, ...d.data(), createdAt: parseDate(d.data().createdAt)
            } as Review));
        } catch (e) {
            return [];
        }
    }
};

export const checkReviewExists = async (requestId: string, reviewerId: string): Promise<boolean> => {
    try {
        const q = query(
            collection(db, REVIEWS_COLLECTION),
            where("requestId", "==", requestId),
            where("reviewerId", "==", reviewerId)
        );
        const snap = await getDocs(q);
        return !snap.empty;
    } catch (error) {
        console.error("Error checking review existence:", error);
        return false;
    }
};

export const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
        const docRef = doc(db, USERS_COLLECTION, userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                memberSince: parseDate(data.memberSince),
            } as User;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        
        // Handle nested BankDetails timestamp if present
        const processedUpdates: any = { ...updates };
        if (updates.bankDetails) {
            processedUpdates.bankDetails = {
                ...updates.bankDetails,
                updatedAt: Timestamp.now()
            };
        }

        await updateDoc(userRef, processedUpdates);
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};

// ============================================
// ADMINISTRATIVE FUNCTIONS
// ============================================

/**
 * Fetch all users for admin management
 */
export const fetchAllUsers = async (): Promise<User[]> => {
    try {
        const q = query(collection(db, USERS_COLLECTION), orderBy("memberSince", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            memberSince: parseDate(d.data().memberSince)
        } as User));
    } catch (error) {
        console.error("Error fetching all users:", error);
        // Fallback if index missing
        const snapshot = await getDocs(collection(db, USERS_COLLECTION));
        return snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            memberSince: parseDate(d.data().memberSince)
        } as User));
    }
};

/**
 * Fetch all items across all users for admin management
 */
export const fetchAllItemsAdmin = async (): Promise<Item[]> => {
    try {
        const q = query(collection(db, ITEMS_COLLECTION), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: parseDate(d.data().createdAt)
        } as Item));
    } catch (error) {
        console.error("Error fetching admin items:", error);
        const snapshot = await getDocs(collection(db, ITEMS_COLLECTION));
        return snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: parseDate(d.data().createdAt)
        } as Item));
    }
};

/**
 * Admin: Update any user profile with Cascade Synchronization
 */
export const adminUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const userSnap = await getDoc(userRef);
        
        // Preserve existing memberSince to prevent account age resets
        let memberSince = updates.memberSince;
        if (!memberSince && userSnap.exists()) {
            memberSince = userSnap.data().memberSince;
        }

        const batch = writeBatch(db);

        // 1. Update User Profile
        batch.set(userRef, {
            ...updates,
            id: userId,
            memberSince: memberSince || Timestamp.now(),
        }, { merge: true });

        // 2. Cascade Synchronization: Update owner snapshot in all items
        const consistencyFields = ['name', 'verified', 'avatar', 'trustScore'];
        const changedFields = Object.keys(updates).filter(key => consistencyFields.includes(key));

        if (changedFields.length > 0) {
            const itemsQuery = query(collection(db, ITEMS_COLLECTION), where("ownerId", "==", userId));
            const itemsSnapshot = await getDocs(itemsQuery);
            
            const syncPayload: any = {};
            changedFields.forEach(field => {
                syncPayload[`owner.${field}`] = (updates as any)[field];
            });

            itemsSnapshot.docs.forEach(itemDoc => {
                batch.update(itemDoc.ref, syncPayload);
            });
        }

        await batch.commit();
        console.log(`Successfully updated user ${userId} and synced ${changedFields.length} fields across items.`);
    } catch (error) {
        console.error("Error in adminUpdateUser:", error);
        throw error;
    }
};

/**
 * Admin: Delete any item (cascade delete)
 */
export const adminDeleteItem = async (itemId: string) => {
    try {
        console.log(`Admin starting cascade delete for item: ${itemId}`);
        const requestsQuery = query(collection(db, REQUESTS_COLLECTION), where("itemId", "==", itemId));
        const requestsSnapshot = await getDocs(requestsQuery);

        const deletePromises: Promise<void>[] = [];
        for (const requestDoc of requestsSnapshot.docs) {
            const messagesRef = collection(db, REQUESTS_COLLECTION, requestDoc.id, MESSAGES_SUBCOLLECTION);
            const messagesSnapshot = await getDocs(messagesRef);
            messagesSnapshot.docs.forEach(msgDoc => { deletePromises.push(deleteDoc(msgDoc.ref)); });
            deletePromises.push(deleteDoc(requestDoc.ref));
        }
        await Promise.all(deletePromises);

        const itemRef = doc(db, ITEMS_COLLECTION, itemId);
        await deleteDoc(itemRef);
        console.log(`Admin successfully cascade deleted item: ${itemId}`);
    } catch (error) {
        console.error("Admin error in cascade delete:", error);
        throw error;
    }
};

/**
 * Admin: Delete a user and all their associated items
 */
export const adminDeleteUser = async (userId: string) => {
    try {
        console.log(`Admin starting cascade delete for user: ${userId}`);
        
        // 1. Find all items owned by this user
        const itemsQuery = query(collection(db, ITEMS_COLLECTION), where("ownerId", "==", userId));
        const itemsSnapshot = await getDocs(itemsQuery);
        
        // 2. Delete each item (this will trigger its own sub-collection cleanup in adminDeleteItem logic)
        const itemDeletes = itemsSnapshot.docs.map(itemDoc => adminDeleteItem(itemDoc.id));
        await Promise.all(itemDeletes);
        
        // 3. Delete the user profile itself
        const userRef = doc(db, USERS_COLLECTION, userId);
        await deleteDoc(userRef);
        
        console.log(`Admin successfully deleted user ${userId} and all associated items.`);
    } catch (error) {
        console.error("Admin error in delete user:", error);
        throw error;
    }
};

// ============================================
// REFERRAL & BONUS FUNCTIONS
// ============================================

const REFERRAL_POINTS_COLLECTION = "referral_points_history";

/**
 * Generate a unique referral code based on name and random suffix
 */
export const generateUniqueReferralCode = async (name: string): Promise<string> => {
    const base = name.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
    let code = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Check if exists
    const q = query(collection(db, USERS_COLLECTION), where("referralCode", "==", code));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
        return generateUniqueReferralCode(name); // Recurse if collision
    }
    return code;
};

/**
 * Update user Referral Points and log history
 */
/**
 * Update user Referral Points and log history via secure API
 */
export const updateReferralPoints = async (userId: string, amount: number, reason: string) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const currentPoints = userSnap.data().referralPoints || 0;
            
            // Use Secure API for points update to avoid rule restrictions
            await secureUpdateUserStats(userId, {
                referralPoints: currentPoints + amount
            }, reason);
            
            // Log history (Client can still write to history if allowed, or we move this too. 
            // In rules history is allow create: if isSignedIn, so this is fine.)
            await addDoc(collection(db, REFERRAL_POINTS_COLLECTION), {
                userId,
                amount,
                reason,
                timestamp: Timestamp.now()
            });
        }
    } catch (error: any) {
        console.error("Error updating points via secure API:", error);
    }
};

/**
 * Process referral: Reward both users
 */
export const processReferral = async (newUserId: string, referralCode: string) => {
    try {
        const q = query(collection(db, USERS_COLLECTION), where("referralCode", "==", referralCode));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            const referrerDoc = snap.docs[0];
            const referrerId = referrerDoc.id;
            
            // 1. Mark new user as referred
            const newUserRef = doc(db, USERS_COLLECTION, newUserId);
            await updateDoc(newUserRef, {
                referredBy: referralCode,
                referralPoints: 50 // New user bonus
            });
            
            // 2. Reward referrer
            const currentReferralCount = referrerDoc.data().referralCount || 0;
            const referrerRef = doc(db, USERS_COLLECTION, referrerId);
            await updateDoc(referrerRef, {
                referralCount: currentReferralCount + 1,
            });
            
            await updateReferralPoints(referrerId, 50, "Referral sign-up bonus");
            
            console.log(`Successfully processed referral from ${referralCode} for user ${newUserId}`);
            return true;
        }
        return false;
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            console.error("CRITICAL: Referral processing failed due to missing Firestore permissions. Please apply the rules from firestore.rules.");
        } else {
            console.error("Error processing referral:", error);
        }
        return false;
    }
};

/**
 * Fetch Referral Points history for a user
 */
export const fetchReferralPointsHistory = async (userId: string) => {
    try {
        const q = query(
            collection(db, REFERRAL_POINTS_COLLECTION),
            where("userId", "==", userId),
            orderBy("timestamp", "desc"),
            limit(10)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            timestamp: parseDate(d.data().timestamp)
        }));
    } catch (error) {
        console.error("Error fetching points history:", error);
        return [];
    }
};





