import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Trip, ItineraryItem } from '../types';
import { Bot, Sparkles, Send, Loader2, Plus, MapPin, Clock } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface AIAssistantProps {
  user: any;
  selectedTrip: Trip | null;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ user, selectedTrip }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [prompt, setPrompt] = useState('');

  const generateItinerary = async () => {
    if (!selectedTrip) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const tripPrompt = `Generate a travel itinerary for a trip to ${selectedTrip.destination} from ${selectedTrip.startDate} to ${selectedTrip.endDate} for ${selectedTrip.travelers} travelers with a budget of INR ${selectedTrip.budget}. 
      Provide a list of 5 recommended activities with time, activity name, and location. 
      Format the output as a JSON array of objects with keys: day (number), time (string), activity (string), location (string).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: tripPrompt,
      });
      const text = response.text;
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        setSuggestions(JSON.parse(jsonMatch[0]));
      }
    } catch (error) {
      console.error("AI Generation failed", error);
    } finally {
      setLoading(false);
    }
  };

  const addToItinerary = async (item: any) => {
    if (!selectedTrip) return;
    try {
      await addDoc(collection(db, 'itineraries'), {
        tripId: selectedTrip.id,
        userId: user.uid,
        day: item.day || 1,
        time: item.time,
        activity: item.activity,
        location: item.location,
        isAISuggested: true,
      });
      // Remove from suggestions after adding
      setSuggestions(suggestions.filter(s => s !== item));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'itineraries');
    }
  };

  if (!selectedTrip) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Select a trip to use AI Assistant</h3>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Bot className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">AI Travel Assistant</h2>
          </div>
          <p className="text-emerald-50 max-w-xl text-lg">
            Let our AI help you plan the perfect itinerary for your trip to {selectedTrip.destination}.
          </p>
          <button
            onClick={generateItinerary}
            disabled={loading}
            className="mt-8 px-8 py-3 bg-white text-emerald-600 rounded-2xl font-bold hover:bg-emerald-50 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Generate Itinerary Suggestions
          </button>
        </div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center text-gray-900">
            <Sparkles className="w-5 h-5 mr-2 text-purple-500" /> AI Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase">Day {item.day}</span>
                    <span className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <Clock className="w-3 h-3 mr-1" /> {item.time}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">{item.activity}</h4>
                  <p className="text-sm text-gray-500 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" /> {item.location}
                  </p>
                </div>
                <button
                  onClick={() => addToItinerary(item)}
                  className="mt-6 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add to My Itinerary
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Ask anything about {selectedTrip.destination}</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. What are the best local restaurants?"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors shadow-md">
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
