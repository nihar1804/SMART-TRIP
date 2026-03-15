import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Trip, Hotel } from '../types';
import { Bed, Star, CheckCircle2, Plus, Trash2, ExternalLink, X, Loader2 } from 'lucide-react';

interface HotelSectionProps {
  user: any;
  selectedTrip: Trip | null;
}

interface PartnerHotel extends Partial<Hotel> {
  source: string;
  location: string;
}

const HotelSection: React.FC<HotelSectionProps> = ({ user, selectedTrip }) => {
  const [bookedHotels, setBookedHotels] = useState<Hotel[]>([]);
  const [suggestedHotels, setSuggestedHotels] = useState<PartnerHotel[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedHotelForBooking, setSelectedHotelForBooking] = useState<PartnerHotel | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [bookingMessage, setBookingMessage] = useState('');

  const [bookingForm, setBookingForm] = useState({
    fullName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: ''
  });

  useEffect(() => {
    if (!selectedTrip || !user) return;

    const q = query(
      collection(db, 'hotels'), 
      where('tripId', '==', selectedTrip.id),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hotel));
      setBookedHotels(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'hotels');
    });

    // Suggested hotels based on popular platforms
    const platforms = ['MakeMyTrip', 'Agoda', 'OYO', 'Booking.com'];
    const mockHotels: PartnerHotel[] = [
      { 
        name: 'The Grand Residency', 
        pricePerNight: 3500, 
        rating: 4.8, 
        location: 'City Center',
        source: 'MakeMyTrip',
        image: `https://picsum.photos/seed/${selectedTrip.destination}1/400/300` 
      },
      { 
        name: 'Riverside Boutique Stay', 
        pricePerNight: 2800, 
        rating: 4.5, 
        location: 'Riverfront',
        source: 'Agoda',
        image: `https://picsum.photos/seed/${selectedTrip.destination}2/400/300` 
      },
      { 
        name: 'OYO Townhouse Elite', 
        pricePerNight: 1200, 
        rating: 4.2, 
        location: 'Near Station',
        source: 'OYO',
        image: `https://picsum.photos/seed/${selectedTrip.destination}3/400/300` 
      },
      { 
        name: 'Heritage Luxury Suites', 
        pricePerNight: 4800, 
        rating: 4.9, 
        location: 'Old Town',
        source: 'Booking.com',
        image: `https://picsum.photos/seed/${selectedTrip.destination}4/400/300` 
      },
      { 
        name: 'Cozy Budget Inn', 
        pricePerNight: 850, 
        rating: 3.9, 
        location: 'Suburbs',
        source: 'OYO',
        image: `https://picsum.photos/seed/${selectedTrip.destination}5/400/300` 
      },
      { 
        name: 'Skyline View Hotel', 
        pricePerNight: 4200, 
        rating: 4.7, 
        location: 'Financial District',
        source: 'Agoda',
        image: `https://picsum.photos/seed/${selectedTrip.destination}6/400/300` 
      },
    ];
    setSuggestedHotels(mockHotels);

    return () => unsubscribe();
  }, [selectedTrip, user]);

  const handleOpenBookingModal = (hotel: PartnerHotel) => {
    setSelectedHotelForBooking(hotel);
    setIsBookingModalOpen(true);
    setBookingStatus('idle');
    setBookingMessage('');
    setBookingForm({
      ...bookingForm,
      checkIn: selectedTrip?.startDate || '',
      checkOut: selectedTrip?.endDate || ''
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotelForBooking || !selectedTrip) return;

    setBookingStatus('loading');
    try {
      const response = await fetch('/api/book-hotel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingForm,
          hotelName: selectedHotelForBooking.name,
          destination: selectedTrip.destination,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setBookingStatus('success');
        setBookingMessage(data.message);
        
        // Also save to Firestore as a "pending" booking
        await addDoc(collection(db, 'hotels'), {
          name: selectedHotelForBooking.name,
          pricePerNight: selectedHotelForBooking.pricePerNight,
          rating: selectedHotelForBooking.rating,
          image: selectedHotelForBooking.image,
          tripId: selectedTrip.id,
          userId: user.uid,
          isBooked: true,
          status: 'pending'
        });

      } else {
        setBookingStatus('error');
        setBookingMessage(data.error || 'Failed to send booking request');
      }
    } catch (error) {
      setBookingStatus('error');
      setBookingMessage('An unexpected error occurred');
    }
  };

  const handleCancelBooking = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'hotels', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `hotels/${id}`);
    }
  };

  if (!selectedTrip) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Bed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Select a trip to view hotels</h3>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <h3 className="text-2xl font-bold flex items-center">
          <CheckCircle2 className="w-6 h-6 mr-2 text-emerald-600" /> My Bookings
        </h3>
        {bookedHotels.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border-2 border-dashed border-gray-200 text-center">
            <p className="text-gray-500">No hotels booked yet for this trip.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookedHotels.map((hotel) => (
              <div key={hotel.id} className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
                <div className="h-48 relative">
                  <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {(hotel as any).status === 'pending' ? 'Request Sent' : 'Booked'}
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <h4 className="font-bold text-lg text-gray-900">{hotel.name}</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1 text-sm font-bold text-gray-700">{hotel.rating}</span>
                    </div>
                    <div className="text-gray-900 font-bold">INR {hotel.pricePerNight} <span className="text-gray-500 font-normal text-sm">/ night</span></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCancelBooking(hotel.id)}
                    className="w-full py-2 text-red-600 font-medium text-sm hover:bg-red-50 rounded-xl transition-colors"
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <h3 className="text-2xl font-bold flex items-center">
          <Bed className="w-6 h-6 mr-2 text-emerald-600" /> Recommended Hotels in {selectedTrip.destination}
        </h3>
        <p className="text-gray-500 text-sm">Showing popular options from MakeMyTrip, Agoda, OYO, and Booking.com</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestedHotels.map((hotel, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
              <div className="h-48 overflow-hidden relative">
                <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-emerald-700 shadow-sm">
                  {hotel.source}
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-lg text-gray-900 truncate flex-1">{hotel.name}</h4>
                  <div className="flex items-center text-yellow-500 ml-2">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 text-sm font-bold text-gray-700">{hotel.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 flex items-center">
                  <ExternalLink className="w-3 h-3 mr-1" /> {hotel.location}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <div className="text-gray-900 font-bold text-lg">INR {hotel.pricePerNight} <span className="text-gray-500 font-normal text-xs">/ night</span></div>
                  <button
                    type="button"
                    onClick={() => handleOpenBookingModal(hotel)}
                    disabled={bookedHotels.some(bh => bh.name === hotel.name)}
                    className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                      bookedHotels.some(bh => bh.name === hotel.name)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                    }`}
                  >
                    {bookedHotels.some(bh => bh.name === hotel.name) ? 'Requested' : 'Book Now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsBookingModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-600 text-white">
              <h3 className="text-xl font-bold">Book Hotel: {selectedHotelForBooking?.name}</h3>
              <button 
                type="button"
                onClick={() => setIsBookingModalOpen(false)} 
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              {bookingStatus === 'success' ? (
                <div className="text-center py-10 space-y-4">
                  <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900">Request Sent!</h4>
                  <p className="text-gray-600">{bookingMessage}</p>
                  <button 
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="mt-6 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Full Name</label>
                      <input
                        type="text"
                        required
                        value={bookingForm.fullName}
                        onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Email Address</label>
                      <input
                        type="email"
                        required
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Number of Guests</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={bookingForm.guests}
                        onChange={(e) => setBookingForm({ ...bookingForm, guests: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Check-in Date</label>
                      <input
                        type="date"
                        required
                        value={bookingForm.checkIn}
                        onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Check-out Date</label>
                      <input
                        type="date"
                        required
                        value={bookingForm.checkOut}
                        onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Special Requests</label>
                    <textarea
                      rows={3}
                      value={bookingForm.specialRequests}
                      onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Late check-in, extra bed, etc."
                    ></textarea>
                  </div>
                  
                  {bookingStatus === 'error' && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                      {bookingMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={bookingStatus === 'loading'}
                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {bookingStatus === 'loading' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending Request...
                      </>
                    ) : (
                      'Confirm Booking Request'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelSection;
