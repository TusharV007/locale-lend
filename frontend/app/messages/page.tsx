"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { ChatWindow } from '@/components/ChatWindow';
import { AddItemModal } from '@/components/AddItemModal';
import { PaymentModal } from '@/components/PaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MessageCircle, Check, X, Clock, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { fetchUserRequests, updateRequestStatus, type RequestData } from '@/lib/db';
import { useAsyncAction } from '@/hooks/useAsyncAction';

export default function MessagesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [requests, setRequests] = useState<RequestData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [paymentRequest, setPaymentRequest] = useState<RequestData | null>(null);
    const { performAction } = useAsyncAction();

    useEffect(() => {
        if (!authLoading && !user) router.push('/auth');
    }, [user, authLoading, router]);

    const fetchRequests = async () => {
        if (!user) return;
        try {
            const data = await fetchUserRequests(user.uid);
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch requests', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchRequests();
            const interval = setInterval(fetchRequests, 10000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleStatusUpdate = async (requestId: string, newStatus: 'accepted' | 'rejected') => {
        await performAction(
            () => updateRequestStatus(requestId, newStatus),
            {
                successMessage: `Request ${newStatus} successfully!`,
                onSuccess: () => fetchRequests(),
            }
        );
    };

    // Auto-open chat from notification query param
    useEffect(() => {
        if (requests.length > 0 && !selectedRequest) {
            const params = new URLSearchParams(window.location.search);
            const chatId = params.get('chat');
            if (chatId) {
                const req = requests.find(r => r.id === chatId);
                if (req) {
                    setSelectedRequest(req);
                    // Clear the query parameter so it doesn't re-open on manual refresh
                    window.history.replaceState({}, '', '/messages');
                }
            }
        }
    }, [requests, selectedRequest]);

    if (authLoading || (!user && loading)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return null;

    const incomingRequests = requests.filter(r => r.lenderId === user.uid);
    const outgoingRequests = requests.filter(r => r.borrowerId === user.uid);

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar onAddItemClick={() => setIsAddItemModalOpen(true)} />

            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                    <MessageCircle className="w-8 h-8 text-primary" />
                    Messages
                </h1>

                <Tabs defaultValue="incoming" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="incoming">
                            Inbox ({incomingRequests.filter(r => r.status === 'pending').length})
                        </TabsTrigger>
                        <TabsTrigger value="outgoing">My Requests ({outgoingRequests.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="incoming" className="space-y-4">
                        {incomingRequests.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No incoming requests.</p>
                        ) : (
                            incomingRequests.map(req => (
                                <RequestCard
                                    key={req.id}
                                    request={req}
                                    isIncoming={true}
                                    currentUserId={user.uid}
                                    onStatusUpdate={handleStatusUpdate}
                                    onChatOpen={() => setSelectedRequest(req)}
                                    onPayment={() => setPaymentRequest(req)}
                                />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="outgoing" className="space-y-4">
                        {outgoingRequests.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No active requests.</p>
                        ) : (
                            outgoingRequests.map(req => (
                                <RequestCard
                                    key={req.id}
                                    request={req}
                                    isIncoming={false}
                                    currentUserId={user.uid}
                                    onStatusUpdate={handleStatusUpdate}
                                    onChatOpen={() => setSelectedRequest(req)}
                                    onPayment={() => setPaymentRequest(req)}
                                />
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <AnimatePresence>
                {selectedRequest && (
                    <ChatWindow
                        request={selectedRequest}
                        onClose={() => setSelectedRequest(null)}
                    />
                )}
            </AnimatePresence>

            {paymentRequest && (
                <PaymentModal
                    isOpen={!!paymentRequest}
                    onClose={() => setPaymentRequest(null)}
                    requestId={paymentRequest.id}
                    itemTitle={paymentRequest.itemTitle}
                    itemId={paymentRequest.itemId}
                    lenderId={paymentRequest.lenderId}
                    lenderName={paymentRequest.lenderName}
                    rentalPricePerDay={paymentRequest.rentalPricePerDay}
                    rentalDays={paymentRequest.rentalDays}
                    onSuccess={() => {
                        setPaymentRequest(null);
                        fetchRequests();
                    }}
                />
            )}

            <AddItemModal
                isOpen={isAddItemModalOpen}
                onClose={() => setIsAddItemModalOpen(false)}
                onSuccess={() => {
                    setIsAddItemModalOpen(false);
                    toast.success('Item listed successfully!');
                }}
            />
        </div>
    );
}

const RequestCard = ({
    request,
    isIncoming,
    currentUserId,
    onStatusUpdate,
    onChatOpen,
    onPayment,
}: {
    request: RequestData;
    isIncoming: boolean;
    currentUserId: string;
    onStatusUpdate: (id: string, status: 'accepted' | 'rejected') => void;
    onChatOpen: () => void;
    onPayment: () => void;
}) => {
    const showPayButton = !isIncoming
        && request.status === 'accepted'
        && request.paymentStatus !== 'paid';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-xl p-4 shadow-sm"
        >
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={
                            request.status === 'accepted' ? 'default' :
                                request.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>

                        {request.paymentStatus === 'paid' && (
                            <Badge variant="outline" className="text-green-600 border-green-300 text-xs flex items-center gap-1">
                                <Check className="w-3 h-3" /> Paid
                            </Badge>
                        )}

                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    <h3 className="font-semibold text-foreground">{request.itemTitle}</h3>

                    <p className="text-sm text-muted-foreground mt-1">
                        {isIncoming
                            ? <><span className="text-foreground font-medium">{request.borrowerName}</span> wants to borrow this</>
                            : <>To: <span className="font-medium text-foreground">{request.lenderName}</span></>
                        }
                    </p>

                    {request.rentalPricePerDay !== undefined && request.rentalPricePerDay > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" />
                            {request.rentalPricePerDay}/day rental • {request.rentalDays || 1} {request.rentalDays === 1 ? 'day' : 'days'}
                        </p>
                    )}

                    {request.message && (
                        <div className="mt-3 bg-secondary/50 p-3 rounded-lg text-sm italic text-muted-foreground">
                            "{request.message}"
                        </div>
                    )}
                </div>

                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0 flex-wrap">
                    <Button size="sm" variant="outline" onClick={onChatOpen} className="flex-1 md:flex-none">
                        <MessageCircle className="w-4 h-4 mr-2" /> Chat
                    </Button>

                    {showPayButton && (
                        <Button
                            size="sm"
                            onClick={onPayment}
                            className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white"
                        >
                            <IndianRupee className="w-4 h-4 mr-1" />
                            {request.rentalPricePerDay ? `Pay ₹${request.rentalPricePerDay}` : 'Confirm Borrow'}
                        </Button>
                    )}

                    {isIncoming && request.status === 'pending' && (
                        <>
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none"
                                onClick={() => onStatusUpdate(request.id, 'accepted')}
                            >
                                <Check className="w-4 h-4 mr-1" /> Accept
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1 md:flex-none"
                                onClick={() => onStatusUpdate(request.id, 'rejected')}
                            >
                                <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
