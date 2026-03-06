"use client";

import { useState } from 'react';
import { collection, doc, setDoc, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

const CITIES = [
  // Andhra Pradesh
  { name: 'Visakhapatnam', lat: 17.6868 + (Math.random() - 0.5) * 0.1, lng: 83.2185 + (Math.random() - 0.5) * 0.1 },
  { name: 'Vijayawada', lat: 16.5062 + (Math.random() - 0.5) * 0.1, lng: 80.6480 + (Math.random() - 0.5) * 0.1 },
  { name: 'Tirupati', lat: 13.6288 + (Math.random() - 0.5) * 0.1, lng: 79.4192 + (Math.random() - 0.5) * 0.1 },
  { name: 'Guntur', lat: 16.3067 + (Math.random() - 0.5) * 0.1, lng: 80.4365 + (Math.random() - 0.5) * 0.1 },
  { name: 'Nellore', lat: 14.4426 + (Math.random() - 0.5) * 0.1, lng: 79.9865 + (Math.random() - 0.5) * 0.1 },
  // Tamil Nadu
  { name: 'Chennai', lat: 13.0827 + (Math.random() - 0.5) * 0.1, lng: 80.2707 + (Math.random() - 0.5) * 0.1 },
  { name: 'Coimbatore', lat: 11.0168 + (Math.random() - 0.5) * 0.1, lng: 76.9558 + (Math.random() - 0.5) * 0.1 },
  { name: 'Madurai', lat: 9.9252 + (Math.random() - 0.5) * 0.1, lng: 78.1198 + (Math.random() - 0.5) * 0.1 },
  { name: 'Salem', lat: 11.6643 + (Math.random() - 0.5) * 0.1, lng: 78.1460 + (Math.random() - 0.5) * 0.1 },
  { name: 'Tiruchirappalli', lat: 10.7905 + (Math.random() - 0.5) * 0.1, lng: 78.7047 + (Math.random() - 0.5) * 0.1 },
];

const CATEGORIES = ['Tools', 'Electronics', 'Kitchen', 'Outdoor', 'Books', 'Sports'];
const CONDITIONS = ['new', 'like_new', 'good', 'fair'];

const TITLES: Record<string, string[]> = {
  Tools: ['Power Drill', 'Hammer set', 'Ladder', 'Screwdriver Set', 'Circular Saw', 'Wrench Set'],
  Electronics: ['DSLR Camera', 'Projector', 'Bluetooth Speaker', 'Drone', 'Gaming Console', 'Tablet'],
  Kitchen: ['Stand Mixer', 'Air Fryer', 'Food Processor', 'Juicer', 'Pasta Maker', 'BBQ Grill'],
  Outdoor: ['Tent 4-person', 'Camping Chair', 'Sleeping Bag', 'Cooler', 'Camping Stove', 'Trekking Poles'],
  Books: ['Harry Potter Box Set', 'Cookbook Collection', 'Board Game - Catan', 'Scrabble', 'Chess Set', 'Lord of the Rings'],
  Sports: ['Tennis Racket', 'Cricket Bat', 'Football', 'Yoga Mat', 'Dumbbells', 'Bicycle']
};

const NAMES = ['Rahul', 'Priya', 'Arjun', 'Meera', 'Karthik', 'Swati', 'Vikram', 'Anjali', 'Suresh', 'Deepa'];

function generateRandomItem(id: string) {
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
    images: ['https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=400&auto=format&fit=crop'],
    ownerId: `mock-user-${Math.floor(Math.random() * 1000)}`,
    owner: {
      name: ownerName,
      trustScore: 4 + Math.random(),
    },
    location: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    status: Math.random() > 0.1 ? 'available' : 'unavailable',
    rentalPricePerDay: Math.random() > 0.6 ? Math.floor(Math.random() * 50) * 10 : 0,
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
    try {
      const snap = await getDocs(collection(db, 'items'));
      let deletedCount = 0;
      for (const d of snap.docs) {
        if (d.id.startsWith('item-seed-')) {
          await deleteDoc(d.ref);
          deletedCount++;
        }
      }
      alert(`Successfully deleted ${deletedCount} seeded items!`);
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Error clearing data: ' + (error as any).message);
    } finally {
      setClearing(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setProgress(0);
    const total = 200;

    try {
      // First, clear the bad data
      const snap = await getDocs(collection(db, 'items'));
      for (const d of snap.docs) {
        if (d.id.startsWith('item-seed-')) {
          await deleteDoc(d.ref);
        }
      }

      for (let i = 0; i < total; i++) {
        const id = `item-seed-${i}-${Date.now()}`;
        const itemRef = doc(collection(db, 'items'), id);
        await setDoc(itemRef, generateRandomItem(id));
        setProgress(i + 1);
      }
      alert('Successfully seeded 200 items!');
    } catch (error) {
      console.error('Error seeding:', error);
      alert('Error seeding: ' + (error as any).message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-8 bg-background">
      <h1 className="text-3xl font-bold mb-4 text-foreground">Database Seeding Tool</h1>
      <p className="mb-8 text-muted-foreground">Populate or remove 200 random products across Andhra Pradesh and Tamil Nadu.</p>
      <div className="flex gap-4">
        <Button onClick={handleSeed} disabled={seeding || clearing} size="xl">
          {seeding ? `Seeding (${progress}/200)...` : 'Start Seeding 200 Items'}
        </Button>
        <Button onClick={handleClear} disabled={seeding || clearing} size="xl" variant="destructive">
          {clearing ? 'Clearing...' : 'Delete All Seeded Data'}
        </Button>
      </div>
    </div>
  );
}
