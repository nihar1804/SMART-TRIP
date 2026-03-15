import React from 'react';
import { Trip } from '../types';
import { Calendar, MapPin, Users, Plus, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  trips: Trip[];
  onSelectTrip: (trip: Trip) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ trips, onSelectTrip }) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Trips</h1>
          <p className="text-gray-500 mt-1">Manage your upcoming and past adventures.</p>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No trips planned yet</h3>
          <p className="text-gray-500 mt-2">Start your next journey by creating a new trip.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div
              key={trip.id}
              onClick={() => onSelectTrip(trip)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="h-40 bg-emerald-600 relative overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/${trip.destination}/800/400`}
                  alt={trip.destination}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">{trip.destination}</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
                  {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-2 text-emerald-600" />
                    {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}
                  </div>
                  <div className="text-emerald-600 font-bold">
                    INR {trip.budget.toLocaleString()}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-50 flex justify-end">
                  <span className="text-emerald-600 text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform">
                    View Details <ArrowRight className="w-4 h-4 ml-1" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
