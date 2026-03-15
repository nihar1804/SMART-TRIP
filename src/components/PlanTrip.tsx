import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Trip, ItineraryItem } from '../types';
import { Plus, Calendar, MapPin, Users, DollarSign, Trash2, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

interface PlanTripProps {
  user: any;
  selectedTrip: Trip | null;
  setSelectedTrip: (trip: Trip | null) => void;
}

const PlanTrip: React.FC<PlanTripProps> = ({ user, selectedTrip, setSelectedTrip }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(1);
  const [budget, setBudget] = useState(1000);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [newActivity, setNewActivity] = useState({ day: 1, time: '', activity: '', location: '' });

  useEffect(() => {
    if (!selectedTrip || !user) return;

    const q = query(
      collection(db, 'itineraries'), 
      where('tripId', '==', selectedTrip.id),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItineraryItem));
      setItinerary(items.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'itineraries');
    });

    return () => unsubscribe();
  }, [selectedTrip, user]);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'trips'), {
        userId: user.uid,
        destination,
        startDate,
        endDate,
        travelers,
        budget,
        createdAt: new Date().toISOString(),
      });
      setIsCreating(false);
      // Reset form
      setDestination('');
      setStartDate('');
      setEndDate('');
      setTravelers(1);
      setBudget(1000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'trips');
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;
    try {
      await addDoc(collection(db, 'itineraries'), {
        ...newActivity,
        tripId: selectedTrip.id,
        userId: user.uid,
        isAISuggested: false,
      });
      setNewActivity({ day: 1, time: '', activity: '', location: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'itineraries');
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'itineraries', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `itineraries/${id}`);
    }
  };

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-2xl font-bold mb-6">Plan Your Next Adventure</h2>
        <form onSubmit={handleCreateTrip} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Paris, France"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Budget (INR)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  required
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Travelers</label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  required
                  min="1"
                  value={travelers}
                  onChange={(e) => setTravelers(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-md"
            >
              Create Trip
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (!selectedTrip) {
    return (
      <div className="text-center py-20">
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Plan New Trip
        </button>
      </div>
    );
  }

  const tripDays = differenceInDays(new Date(selectedTrip.endDate), new Date(selectedTrip.startDate)) + 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{selectedTrip.destination}</h2>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-emerald-600" /> {format(new Date(selectedTrip.startDate), 'MMM d')} - {format(new Date(selectedTrip.endDate), 'MMM d, yyyy')}</span>
            <span className="flex items-center"><Users className="w-4 h-4 mr-1 text-emerald-600" /> {selectedTrip.travelers} Travelers</span>
            <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1 text-emerald-600" /> Budget: INR {selectedTrip.budget}</span>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-medium hover:bg-emerald-100 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> New Trip
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-emerald-600" /> Itinerary
          </h3>
          
          {Array.from({ length: tripDays }).map((_, i) => {
            const dayNum = i + 1;
            const dayDate = addDays(new Date(selectedTrip.startDate), i);
            const dayActivities = itinerary.filter(item => item.day === dayNum);

            return (
              <div key={dayNum} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h4 className="font-bold text-gray-900">Day {dayNum} - {format(dayDate, 'EEEE, MMM d')}</h4>
                </div>
                <div className="p-6 space-y-4">
                  {dayActivities.length === 0 ? (
                    <p className="text-gray-400 text-sm italic">No activities planned for this day.</p>
                  ) : (
                    dayActivities.map((item) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 group">
                        <div className="mt-1">
                          <Clock className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{item.time}</span>
                            <button onClick={() => handleDeleteActivity(item.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <h5 className="font-bold text-gray-900">{item.activity}</h5>
                          {item.location && (
                            <p className="text-sm text-gray-500 flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" /> {item.location}
                            </p>
                          )}
                          {item.isAISuggested && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-2">
                              <Sparkles className="w-3 h-3 mr-1" /> AI Suggested
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-emerald-600" /> Add Activity
            </h3>
            <form onSubmit={handleAddActivity} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Day</label>
                <select
                  value={newActivity.day}
                  onChange={(e) => setNewActivity({ ...newActivity, day: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  {Array.from({ length: tripDays }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
                <input
                  type="time"
                  required
                  value={newActivity.time}
                  onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Activity</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visit Eiffel Tower"
                  value={newActivity.activity}
                  onChange={(e) => setNewActivity({ ...newActivity, activity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Champ de Mars"
                  value={newActivity.location}
                  onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-md"
              >
                Add to Itinerary
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanTrip;
