export interface Trip {
  id: string;
  userId: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  tripId: string;
  userId: string;
  category: 'Flights' | 'Hotels' | 'Food' | 'Activities' | 'Transport' | 'Other';
  amount: number;
  description: string;
  date: string;
}

export interface Hotel {
  id: string;
  tripId: string;
  userId: string;
  name: string;
  pricePerNight: number;
  rating: number;
  image: string;
  isBooked: boolean;
  status?: 'pending' | 'confirmed';
  source?: string;
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  userId: string;
  day: number;
  time: string;
  activity: string;
  location: string;
  isAISuggested: boolean;
}
