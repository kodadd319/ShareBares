
import React, { useState, useEffect } from 'react';
import { StableListing } from '../types';
import { User as UserIcon, MapPin, DollarSign, MessageSquare, Shield, ChevronDown, Filter, Navigation, X } from 'lucide-react';

interface StablePageProps {
  listings: StableListing[];
  onProfileClick?: (userId: string) => void;
}

// Mock coordinates for cities in our system
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Miami': { lat: 25.7617, lng: -80.1918 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'Miami, FL': { lat: 25.7617, lng: -80.1918 },
  'San Francisco, CA': { lat: 37.7749, lng: -122.4194 },
  'Los Angeles, CA': { lat: 34.0522, lng: -118.2437 },
};

// Haversine formula to calculate distance in miles
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3958.8; // Radius of the earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

const StablePage: React.FC<StablePageProps> = ({ listings, onProfileClick }) => {
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [citySearch, setCitySearch] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isRadiusFilterActive, setIsRadiusFilterActive] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsRadiusFilterActive(true);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Location access denied or unavailable.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  const filteredListings = listings.filter(l => {
    const genderMatch = selectedGender === 'all' || l.providerGender === selectedGender;
    const cityMatch = citySearch === '' || l.city.toLowerCase().includes(citySearch.toLowerCase());
    
    let radiusMatch = true;
    if (isRadiusFilterActive && userLocation) {
      // Try to find coordinates for the city
      const cityKey = Object.keys(CITY_COORDINATES).find(key => 
        l.city.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(l.city.toLowerCase())
      );
      
      if (cityKey) {
        const coords = CITY_COORDINATES[cityKey];
        const distance = calculateDistance(userLocation.lat, userLocation.lng, coords.lat, coords.lng);
        radiusMatch = distance <= 25;
      } else {
        // If we don't have coordinates for the city, we can't filter by radius accurately
        // For this demo, we'll assume it's NOT in radius if we don't know where it is
        radiusMatch = false;
      }
    }

    return genderMatch && cityMatch && radiusMatch;
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter chrome-text uppercase mb-2">The Stable</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Find & View Escort Service Listings (In-Person Services)</p>
          
          {isRadiusFilterActive && userLocation && (
            <div className="flex items-center space-x-2 mt-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg w-fit">
              <Navigation size={12} className="text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Filtering by 25 mile radius</span>
              <button 
                onClick={() => setIsRadiusFilterActive(false)}
                className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest ml-2 underline"
              >
                Show All
              </button>
            </div>
          )}
          
          {locationError && !isRadiusFilterActive && (
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-2">
              {locationError} - Manual filtering enabled.
            </p>
          )}
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
          <Shield size={20} className="text-[#967bb6] shrink-0 mt-1" />
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-1">Official Service Disclosure</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed tracking-widest">
              All "In-Person Service" transactions are handled directly between the service provider and the client. 
              ShareBares is a separate entity and serves strictly as a listing platform. ShareBares does not participate in, 
              nor is it responsible for, any service agreements or transactions. All questions, comments, or complaints 
              must be directed to the service provider.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {!isRadiusFilterActive && userLocation && (
            <button 
              onClick={() => setIsRadiusFilterActive(true)}
              className="flex items-center space-x-2 bg-[#967bb6]/10 border border-[#967bb6]/20 rounded-xl px-4 py-2 text-[#967bb6] hover:bg-[#967bb6]/20 transition-all"
            >
              <Navigation size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Near Me (25mi)</span>
            </button>
          )}

          <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 min-w-[200px]">
            <MapPin size={16} className="text-[#967bb6] shrink-0" />
            <input 
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search City..."
              className="bg-transparent text-white text-sm font-bold outline-none uppercase tracking-widest w-full placeholder:text-slate-700"
            />
            {citySearch && (
              <button onClick={() => setCitySearch('')} className="text-slate-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
            <Filter size={16} className="text-[#967bb6]" />
            <select 
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer uppercase tracking-widest"
            >
              <option value="all" className="bg-slate-900">All Genders</option>
              <option value="female" className="bg-slate-900">Female</option>
              <option value="male" className="bg-slate-900">Male</option>
              <option value="non-binary" className="bg-slate-900">Non-Binary</option>
              <option value="transgender" className="bg-slate-900">Transgender</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <div key={listing.id} className="glass-panel rounded-[2.5rem] p-6 border-[#c0c0c0]/10 shadow-2xl relative overflow-hidden chrome-border group hover:border-[#967bb6]/30 transition-all duration-500 flex flex-col h-full">
              <div className="absolute top-0 right-0 p-4 z-10">
                <div className="bg-black/60 backdrop-blur-md text-[#967bb6] text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-[#967bb6]/20">
                  {listing.providerGender}
                </div>
              </div>

              <div className="mb-6">
                <div className="grid grid-cols-2 gap-2 aspect-square rounded-3xl overflow-hidden border border-white/5 bg-black/20">
                  {listing.photos && listing.photos.length > 0 ? (
                    listing.photos.slice(0, 2).map((photo, idx) => (
                      <img 
                        key={idx} 
                        src={photo} 
                        className={`w-full h-full object-cover ${listing.photos?.length === 1 ? 'col-span-2' : ''}`} 
                        alt="" 
                      />
                    ))
                  ) : (
                    <img src={listing.avatarUrl} className="w-full h-full object-cover col-span-2" alt="" />
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h2 
                      className="text-xl font-black text-white tracking-tight uppercase truncate cursor-pointer hover:text-[#967bb6] transition-colors"
                      onClick={() => onProfileClick?.(listing.userId)}
                    >
                      {listing.providerName}
                    </h2>
                    <div className="flex items-center text-slate-500 space-x-1">
                      <MapPin size={10} />
                      <span className="text-[8px] font-black uppercase tracking-widest">{listing.city}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-[#967bb6] space-x-2">
                    <Shield size={12} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Verified Provider</span>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="min-h-[3rem]">
                    <h3 className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Services</h3>
                    <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">{listing.services}</p>
                  </div>

                  <div className="pt-4 border-t border-white/5 mt-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Pricing</p>
                        <p className="text-white font-bold text-sm">{listing.pricing}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Contact</p>
                        <p className="text-[#967bb6] font-bold text-sm break-all">{listing.contactInfo}</p>
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                      <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-600 text-center italic">
                        Only serious inquiries
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-panel rounded-3xl p-20 text-center border-dashed border-white/10 col-span-full">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <MapPin size={24} className="text-slate-700" />
            </div>
            <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No providers found within 25 miles of your location</p>
            {isRadiusFilterActive && (
              <button 
                onClick={() => setIsRadiusFilterActive(false)}
                className="mt-4 text-[#967bb6] font-black uppercase tracking-widest text-xs underline"
              >
                View all listings instead
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StablePage;
