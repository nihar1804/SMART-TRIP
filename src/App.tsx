import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import PlanTrip from './components/PlanTrip';
import BudgetTracker from './components/BudgetTracker';
import HotelSection from './components/HotelSection';
import AIAssistant from './components/AIAssistant';
import { Trip } from './types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Ensure user document exists in Firestore
          await setDoc(doc(db, 'users', currentUser.uid), {
            email: currentUser.email,
            displayName: currentUser.displayName,
            role: 'user', // Default role
            createdAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error("Error syncing user to Firestore:", error);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setTrips([]);
      setSelectedTrip(null);
      return;
    }

    const q = query(collection(db, 'trips'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      setTrips(tripsData);
      if (tripsData.length > 0 && !selectedTrip) {
        setSelectedTrip(tripsData[0]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'trips');
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onUserChange={setUser} />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard trips={trips} onSelectTrip={(trip) => { setSelectedTrip(trip); setActiveSection('plan'); }} />;
      case 'plan':
        return <PlanTrip user={user} selectedTrip={selectedTrip} setSelectedTrip={setSelectedTrip} />;
      case 'budget':
        return <BudgetTracker user={user} selectedTrip={selectedTrip} />;
      case 'hotels':
        return <HotelSection user={user} selectedTrip={selectedTrip} />;
      case 'ai':
        return <AIAssistant user={user} selectedTrip={selectedTrip} />;
      default:
        return <Dashboard trips={trips} onSelectTrip={setSelectedTrip} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar activeSection={activeSection} setActiveSection={setActiveSection} user={user} />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {renderSection()}
      </main>
    </div>
  );
}
