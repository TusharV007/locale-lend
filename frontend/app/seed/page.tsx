"use client";

import { useState } from 'react';
import { collection, doc, setDoc, getDocs, deleteDoc, Timestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Database, Trash2, CheckCircle2 } from 'lucide-react';

const CITIES = [
  // Andhra Pradesh
  { name: 'Visakhapatnam', lat: 17.6868 + (Math.random() - 0.5) * 0.1, lng: 83.2185 + (Math.random() - 0.5) * 0.1 },
  { name: 'Vijayawada', lat: 16.5062 + (Math.random() - 0.5) * 0.1, lng: 80.6480 + (Math.random() - 0.5) * 0.1 },
  { name: 'Tirupati', lat: 13.6288 + (Math.random() - 0.5) * 0.1, lng: 79.4192 + (Math.random() - 0.5) * 0.1 },
  { name: 'Guntur', lat: 16.3067 + (Math.random() - 0.5) * 0.1, lng: 80.4365 + (Math.random() - 0.5) * 0.1 },
  { name: 'Nellore', lat: 14.4426 + (Math.random() - 0.5) * 0.1, lng: 79.9865 + (Math.random() - 0.5) * 0.1 },
  { name: 'Rajahmundry', lat: 17.0005 + (Math.random() - 0.5) * 0.1, lng: 81.8016 + (Math.random() - 0.5) * 0.1 },
  { name: 'Yanam', lat: 16.7331 + (Math.random() - 0.5) * 0.1, lng: 82.2176 + (Math.random() - 0.5) * 0.1 },
  // Tamil Nadu
  { name: 'Chennai', lat: 13.0827 + (Math.random() - 0.5) * 0.1, lng: 80.2707 + (Math.random() - 0.5) * 0.1 },
  { name: 'Coimbatore', lat: 11.0168 + (Math.random() - 0.5) * 0.1, lng: 76.9558 + (Math.random() - 0.5) * 0.1 },
  { name: 'Madurai', lat: 9.9252 + (Math.random() - 0.5) * 0.1, lng: 78.1198 + (Math.random() - 0.5) * 0.1 },
];

const CATEGORIES = ['Tools', 'Electronics', 'Kitchen', 'Outdoor', 'Books', 'Gaming', 'Board Games', 'Sports', 'Construction'];
const CONDITIONS = ['new', 'like_new', 'good', 'fair'];

const TITLES: Record<string, string[]> = {
  Tools: ['Power Drill', 'Hammer set', 'Ladder', 'Screwdriver Set', 'Circular Saw', 'Wrench Set'],
  Electronics: ['DSLR Camera', 'Projector', 'Bluetooth Speaker', 'Drone', 'Gaming Console', 'Tablet'],
  Kitchen: ['Stand Mixer', 'Air Fryer', 'Food Processor', 'Juicer', 'Pasta Maker', 'BBQ Grill'],
  Outdoor: ['Tent 4-person', 'Camping Chair', 'Sleeping Bag', 'Cooler', 'Camping Stove', 'Trekking Poles'],
  Books: ['Harry Potter Box Set', 'Cookbook Collection', 'The Hobbit', 'National Geographic', 'Lord of the Rings'],
  Gaming: ['Nintendo Switch', 'Xbox Series X', 'PlayStation 5', 'Gaming Headset', 'Video Game - Elden Ring'],
  "Board Games": ['Catan', 'Scrabble', 'Chess Set', 'Monopoly', 'Pandemic'],
  Sports: ['Tennis Racket', 'Cricket Bat', 'Football', 'Yoga Mat', 'Dumbbells', 'Bicycle'],
  Construction: ['Cement Mixer', 'Step Ladder', 'Scaffolding', 'Pressure Washer', 'Wheelbarrow', 'Extension Cord']
};

const ITEM_PHOTOS: Record<string, string> = {
  // Tools
  'Power Drill': 'https://images.unsplash.com/photo-1504148455328-43630f1d93e6?w=800&q=80',
  'Hammer set': 'https://images.unsplash.com/photo-1600679472829-3044539ce8ed?w=800&q=80',
  'Ladder': 'https://images.unsplash.com/photo-1595844730298-b9f0ff98ffd0?w=800&q=80',
  'Screwdriver Set': 'https://images.unsplash.com/photo-1600109033306-69d584347209?w=800&q=80',
  'Circular Saw': 'https://images.unsplash.com/photo-1504148455328-43630f1d93e6?w=800&q=80',
  'Wrench Set': 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80',
  // Electronics
  'DSLR Camera': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
  'Projector': 'https://images.unsplash.com/photo-1535016120720-40c646bebbdc?w=800&q=80',
  'Bluetooth Speaker': 'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=800&q=80',
  'Drone': 'https://images.unsplash.com/photo-1524143924401-44331763f295?w=800&q=80',
  'Gaming Console': 'https://images.unsplash.com/photo-1605906302474-f808a68462ef?w=800&q=80',
  'Tablet': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
  // Kitchen
  'Stand Mixer': 'https://images.unsplash.com/photo-1594385208974-2e75f9d8ca28?w=800&q=80',
  'Air Fryer': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&q=80',
  'Food Processor': 'https://images.unsplash.com/photo-1591261730799-ee4e6c2d16d7?w=800&q=80',
  'Juicer': 'https://images.unsplash.com/photo-1622943479647-b8c800ca7196?w=800&q=80',
  'Pasta Maker': 'https://images.unsplash.com/photo-1608797178974-15b35a6401c2?w=800&q=80',
  'BBQ Grill': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
  // Outdoor
  'Tent 4-person': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
  'Camping Chair': 'https://images.unsplash.com/photo-1627575039413-3903938932cd?w=800&q=80',
  'Sleeping Bag': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
  'Cooler': 'https://images.unsplash.com/photo-1603561334651-4043b276ba61?w=800&q=80',
  'Camping Stove': 'https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=800&q=80',
  'Trekking Poles': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  // Books
  'Harry Potter Box Set': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
  'Cookbook Collection': 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&q=80',
  'The Hobbit': 'https://images.unsplash.com/photo-1621350117465-b17b20466311?w=800&q=80',
  'National Geographic': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
  'Lord of the Rings': 'https://images.unsplash.com/photo-1626618012641-bfca5a31239?w=800&q=80',
  // Gaming
  'Nintendo Switch': 'https://images.unsplash.com/photo-1578303321116-b184af6fa39e?w=800&q=80',
  'Xbox Series X': 'https://images.unsplash.com/photo-1605906302474-f808a68462ef?w=800&q=80',
  'PlayStation 5': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80',
  'Gaming Headset': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
  'Video Game - Elden Ring': 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&q=80',
  // Board Games
  'Catan': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&q=80',
  'Scrabble': 'https://images.unsplash.com/photo-1591154669695-5f2a8d20c089?w=800&q=80',
  'Chess Set': 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=800&q=80',
  'Monopoly': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&q=80',
  'Pandemic': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&q=80',
  // Sports
  'Tennis Racket': 'https://images.unsplash.com/photo-1595435066963-0bc6988294b4?w=800&q=80',
  'Cricket Bat': 'https://images.unsplash.com/photo-1531415074941-6ef21368538a?w=800&q=80',
  'Football': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
  'Yoga Mat': 'https://images.unsplash.com/photo-1544126592-807daf21565c?w=800&q=80',
  'Dumbbells': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
  'Bicycle': 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80',
};

const NAMES = ['Rahul', 'Priya', 'Arjun', 'Meera', 'Karthik', 'Swati', 'Vikram', 'Anjali', 'Suresh', 'Deepa'];

const MOCK_USERS = NAMES.map((name, index) => {
  const city = CITIES[index % CITIES.length];
  return {
    id: `neighbor-seed-${index}`,
    name: name + ' ' + String.fromCharCode(65 + index) + '.',
    email: `${name.toLowerCase()}.${index}@local.lend`,
    verified: Math.random() > 0.3,
    trustScore: Math.floor(Math.random() * 40) + 60,
    memberSince: Timestamp.fromMillis(Date.now() - Math.floor(Math.random() * 5000000000)),
    role: 'user',
    isBlocked: false,
    address: `${city.name}, Local Street ${index + 1}`,
    totalReviews: Math.floor(Math.random() * 20),
    itemsLentCount: Math.floor(Math.random() * 10),
    itemsBorrowedCount: Math.floor(Math.random() * 15),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
  };
});

function generateRandomItem(id: string) {
  const owner = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const title = TITLES[category][Math.floor(Math.random() * TITLES[category].length)];
  const condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
  const ownerName = NAMES[Math.floor(Math.random() * NAMES.length)] + ' ' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + '.';
  
  // Distribute lat/lng slightly around the city
  const lat = city.lat + (Math.random() - 0.5) * 0.05;
  const lng = city.lng + (Math.random() - 0.5) * 0.05;

  return {
    title: `${city.name} - ${title}`,
    description: `A ${condition} condition ${title.toLowerCase()} available for borrowing in ${city.name}. Perfect for your next project or weekend!`,
    category,
    condition,
    images: [ITEM_PHOTOS[title] || 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=400&auto=format&fit=crop'],
    ownerId: owner.id,
    owner: {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      avatar: owner.avatar,
      trustScore: owner.trustScore,
      verified: owner.verified,
    },
    location: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    status: Math.random() > 0.1 ? 'available' : 'unavailable',
    rentalPrice: Math.floor(Math.random() * 50) * 10,
    priceUnit: Math.random() > 0.5 ? 'day' : 'hour',
    borrowCount: Math.floor(Math.random() * 10),
    createdAt: Timestamp.fromMillis(Date.now() - Math.floor(Math.random() * 10000000000)),
    updatedAt: Timestamp.now(),
    tags: [title.split(' ')[0], city.name, 'verified'],
    searchKeywords: [title.toLowerCase(), city.name.toLowerCase(), category.toLowerCase()], // for simple prefix search if needed
  };
}

export default function SeedPage() {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleClear = async () => {
    setClearing(true);
    const toastId = toast.loading('Clearing seeded data...');
    try {
      // Clear items
      const itemSnap = await getDocs(collection(db, 'items'));
      let itemDeletedCount = 0;
      for (const d of itemSnap.docs) {
        if (d.id.startsWith('item-seed-')) {
          await deleteDoc(d.ref);
          itemDeletedCount++;
        }
      }

      // Clear users
      const userSnap = await getDocs(collection(db, 'users'));
      let userDeletedCount = 0;
      for (const d of userSnap.docs) {
        if (d.id.startsWith('neighbor-seed-')) {
          await deleteDoc(d.ref);
          userDeletedCount++;
        }
      }

      toast.success(`Deleted ${itemDeletedCount} items and ${userDeletedCount} users!`, { id: toastId });
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Error clearing data: ' + (error as any).message, { id: toastId });
    } finally {
      setClearing(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setProgress(0);
    const totalItems = 100; // Reduced for faster seeding in demo
    const toastId = toast.loading('Starting seeding process...');

    try {
      // 1. Seed Users First
      toast.loading(`Seeding ${MOCK_USERS.length} Neighbor profiles...`, { id: toastId });
      for (const user of MOCK_USERS) {
        await setDoc(doc(db, 'users', user.id), user);
      }

      // 2. Clear previous seeded items
      toast.loading('Cleaning up old markers...', { id: toastId });
      const snap = await getDocs(collection(db, 'items'));
      for (const d of snap.docs) {
        if (d.id.startsWith('item-seed-')) {
          await deleteDoc(d.ref);
        }
      }

      // 3. Seed Items
      for (let i = 0; i < totalItems; i++) {
        const id = `item-seed-${i}-${Date.now()}`;
        const itemRef = doc(collection(db, 'items'), id);
        await setDoc(itemRef, generateRandomItem(id));
        setProgress(i + 1);
        if (i % 20 === 0) {
          toast.loading(`Seeding items: ${i}/${totalItems}...`, { id: toastId });
        }
      }
      
      toast.success(`Successfully seeded ${MOCK_USERS.length} neighbors and ${totalItems} items!`, { id: toastId });
    } catch (error) {
      console.error('Error seeding:', error);
      toast.error('Error seeding: ' + (error as any).message, { id: toastId });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-32 px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-blue-600/20 rounded-3xl text-blue-500 border border-blue-500/20">
            <Database size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">Ecosystem Seeder</h1>
            <p className="text-gray-400 mt-1">Populate your community with mock neighbors and items.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#111111] border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4">Populate Data</h2>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                This will create {MOCK_USERS.length} realistic neighbor profiles and 100 items distributed across major cities.
              </p>
              
              <Button 
                onClick={handleSeed} 
                disabled={seeding || clearing} 
                className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-2xl text-lg font-bold group"
              >
                {seeding ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    Seeding {progress}/100...
                  </>
                ) : (
                  <>Start Seeding <CheckCircle2 className="ml-2 group-hover:scale-110 transition-transform" size={20} /></>
                )}
              </Button>
            </div>
            
            {/* Visual background element */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl" />
          </div>

          <div className="bg-[#111111] border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group">
             <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4">Cleanup</h2>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                Safely removes all seeded items and user profiles without touching real user accounts.
              </p>
              
              <Button 
                onClick={handleClear} 
                disabled={seeding || clearing} 
                variant="outline"
                className="w-full border-red-500/20 hover:bg-red-500/10 text-red-500 h-16 rounded-2xl text-lg font-bold group"
              >
                {clearing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    Clearing...
                  </>
                ) : (
                  <>Wipe Seeded Data <Trash2 className="ml-2 group-hover:shake transition-transform" size={20} /></>
                )}
              </Button>
            </div>
            {/* Visual background element */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-600/10 rounded-full blur-3xl" />
          </div>
        </div>

        <div className="mt-12 p-6 bg-white/5 border border-white/5 rounded-2xl">
          <p className="text-xs text-center text-gray-500 uppercase tracking-[0.2em] font-bold">
            Data targets: Visakhapatnam • Chennai • Coimbatore • Madurai • Guntur • & more
          </p>
        </div>
      </div>
    </div>
  );
}
