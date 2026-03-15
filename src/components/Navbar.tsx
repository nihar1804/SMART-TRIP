import React from 'react';
import { Plane, Wallet, Bed, Bot, LayoutDashboard, MapPin, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase';

interface NavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  user: any;
}

const Navbar: React.FC<NavbarProps> = ({ activeSection, setActiveSection, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'plan', label: 'Plan Trip', icon: MapPin },
    { id: 'budget', label: 'Budget', icon: Wallet },
    { id: 'hotels', label: 'Hotels', icon: Bed },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <Plane className="h-8 w-8 text-emerald-600" />
              <span className="text-xl font-bold text-gray-900 tracking-tight">SmartTrip</span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'border-emerald-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border border-gray-200"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => auth.signOut()}
                  className="flex items-center gap-2 text-gray-500 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 transition-all font-medium"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
