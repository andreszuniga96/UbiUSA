import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTripStore } from '../../stores/useTripStore';
import { GoogleMapsProvider } from '../../services/GoogleMapsProvider';
import { GoogleMapsLoader } from '../../services/GoogleMapsLoader';
import { LocationService, Position } from '../../services/LocationService';
import { VERIFIED_FOOD_PLACES, RecommendationEngine } from '../../services/RecommendationEngine';
import { PlaceDetailCard } from '../components/PlaceDetailCard';
import { Place } from '../../domain/types';
import { 
  ChevronLeft, Search, MapPin, Coffee, Utensils, ShoppingBag, 
  Pill, Train, Bus, Landmark, DollarSign, Trees, Sparkles, 
  Navigation, AlertCircle, WifiOff 
} from 'lucide-react';

interface ReferenceOrigin {
  id: string;
  name: string;
  coords: { lat: number; lng: number };
}

const REFERENCE_ORIGINS: ReferenceOrigin[] = [
  { id: 'cambridge', name: '🏠 Airbnb Cambridge (Lynne)', coords: { lat: 42.3736, lng: -71.1097 } },
  { id: 'bayonne', name: '🏠 Airbnb Bayonne (Carmelo)', coords: { lat: 40.6687, lng: -74.1143 } },
  { id: 'boston-common', name: '🚩 Boston Common (Tour 13 Oct)', coords: { lat: 42.3551, lng: -71.0638 } },
  { id: 'wall-st', name: '🚩 Bowling Green / Wall St (Tour 16 Oct)', coords: { lat: 40.7049, lng: -74.0137 } },
  { id: 'bryant-park', name: '🚩 Bryant Park (Tour 17 Oct)', coords: { lat: 40.7536, lng: -73.9832 } },
  { id: 'battery-park', name: '🚩 Castle Clinton / Estatua (18 Oct)', coords: { lat: 40.7037, lng: -74.0170 } },
  { id: 'bedford', name: '🚩 Brooklyn 162 Bedford (18 Oct)', coords: { lat: 40.7188, lng: -73.9575 } },
  { id: 'soho', name: '🚩 SoHo / Prince St (19 Oct)', coords: { lat: 40.7258, lng: -74.0041 } },
  { id: 'central-park', name: '🚩 Central Park / Plaza (20 Oct)', coords: { lat: 40.7648, lng: -73.9733 } },
  { id: 'disney-springs', name: '🚩 Disney Springs (Orlando 26 Oct)', coords: { lat: 28.3712, lng: -81.5167 } },
];

const SEARCH_CATEGORIES = [
  { id: 'restaurant', label: 'Restaurantes', icon: Utensils, googleType: 'restaurant' },
  { id: 'cafe', label: 'Cafeterías', icon: Coffee, googleType: 'cafe' },
  { id: 'fast_food', label: 'Comida Rápida', icon: Sparkles, googleType: 'fast_food_restaurant' },
  { id: 'supermarket', label: 'Supermercados', icon: ShoppingBag, googleType: 'supermarket' },
  { id: 'pharmacy', label: 'Farmacias', icon: Pill, googleType: 'pharmacy' },
  { id: 'subway_station', label: 'Metro / Tren', icon: Train, googleType: 'subway_station' },
  { id: 'bus_station', label: 'Paradas de Bus', icon: Bus, googleType: 'bus_station' },
  { id: 'park', label: 'Parques', icon: Trees, googleType: 'park' },
  { id: 'museum', label: 'Museos y Cultura', icon: Landmark, googleType: 'museum' },
  { id: 'atm', label: 'Cajeros ATM', icon: DollarSign, googleType: 'atm' },
];

export default function ExploreCity() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isOnline = useTripStore(state => state.isOnline);

  const initialCat = searchParams.get('category') || 'restaurant';
  const initialRef = searchParams.get('ref') || 'bryant-park';

  const [selectedOriginId, setSelectedOriginId] = useState<string>(initialRef);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [textQuery, setTextQuery] = useState<string>('');

  const [gpsPosition, setGpsPosition] = useState<Position | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);

  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // Active Origin Coordinates
  const getActiveCoords = useCallback((): { lat: number; lng: number } => {
    if (selectedOriginId === 'gps' && gpsPosition) {
      return { lat: gpsPosition.lat, lng: gpsPosition.lng };
    }
    const match = REFERENCE_ORIGINS.find(r => r.id === selectedOriginId);
    return match ? match.coords : { lat: 40.7536, lng: -73.9832 }; // default Bryant Park
  }, [selectedOriginId, gpsPosition]);

  // Execute Search
  const performSearch = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const coords = getActiveCoords();

    if (isOnline && GoogleMapsLoader.isConfigured()) {
      try {
        await GoogleMapsLoader.load();
        const provider = new GoogleMapsProvider();
        
        let results: Place[] = [];
        if (textQuery.trim().length > 0) {
          results = await provider.searchPlace(textQuery.trim());
        } else {
          const cat = SEARCH_CATEGORIES.find(c => c.id === selectedCategory);
          results = await provider.searchNearby(coords, 1500, cat?.googleType || 'restaurant');
        }

        if (results.length > 0) {
          // Enrich with distance
          const enriched = results.map(p => {
            const dist = LocationService.distanceTo(coords.lat, coords.lng, p.lat, p.lng);
            return {
              ...p,
              category: SEARCH_CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Lugar cercano',
              description: `A ${Math.round(dist)} m del punto de referencia seleccionado.`
            };
          }).sort((a, b) => {
            const distA = LocationService.distanceTo(coords.lat, coords.lng, a.lat, a.lng);
            const distB = LocationService.distanceTo(coords.lat, coords.lng, b.lat, b.lng);
            return distA - distB;
          });

          setPlaces(enriched);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("[ExploreCity] Online Places API error, using curated fallback", err);
      }
    }

    // Curated Fallback (Offline or when Google returns 0)
    const curatedMatches = VERIFIED_FOOD_PLACES.map(p => {
      const dist = LocationService.distanceTo(coords.lat, coords.lng, p.lat, p.lng);
      const valScore = RecommendationEngine.calculateValueScore(p, dist);
      return {
        id: p.id,
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        precision: 'exacto' as const,
        source: 'CURATED' as const,
        category: p.foodCategory,
        rating: p.googleRating,
        priceLevel: p.priceLevel,
        description: `${p.specialty} — ${p.whyRecommended}`,
        openingHours: p.openingHours,
        funFact: `ValueScore UbiUSA: ${valScore}/10 (Costo-beneficio calculado)`,
      };
    }).sort((a, b) => {
      const distA = LocationService.distanceTo(coords.lat, coords.lng, a.lat, a.lng);
      const distB = LocationService.distanceTo(coords.lat, coords.lng, b.lat, b.lng);
      return distA - distB;
    });

    setPlaces(curatedMatches);
    setIsLoading(false);
  }, [isOnline, selectedCategory, textQuery, getActiveCoords]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleUseGps = async () => {
    setIsGettingGps(true);
    try {
      const pos = await LocationService.getCurrentPosition();
      setGpsPosition(pos);
      setSelectedOriginId('gps');
    } catch {
      setErrorMsg("No se pudo obtener la posición GPS. Selecciona un punto del itinerario.");
    } finally {
      setIsGettingGps(false);
    }
  };

  const activeCoords = getActiveCoords();

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Top Header */}
      <div className="bg-gray-900 text-white pt-10 pb-6 px-4 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => navigate(-1)} 
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-md transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isOnline ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
            }`}>
              {isOnline ? '● PLACES ONLINE' : '○ CURADO OFFLINE'}
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight mb-1">
            Lugares & Servicios Cercanos
          </h1>
          <p className="text-gray-300 text-xs leading-relaxed max-w-sm mb-4">
            Descubre opciones con el mejor costo-beneficio cerca de tu ubicación o de los puntos clave del viaje.
          </p>

          {/* Reference Point Selector */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300 font-bold flex items-center gap-1.5">
                <MapPin size={14} className="text-indigo-400" /> Punto de referencia:
              </span>
              <button
                onClick={handleUseGps}
                disabled={isGettingGps}
                className="text-[11px] font-bold text-indigo-300 hover:text-white flex items-center gap-1"
              >
                <Navigation size={12} className={isGettingGps ? 'animate-spin' : ''} />
                <span>{selectedOriginId === 'gps' ? 'GPS Activo' : 'Usar mi GPS'}</span>
              </button>
            </div>

            <select
              value={selectedOriginId}
              onChange={(e) => setSelectedOriginId(e.target.value)}
              className="bg-gray-800 text-white rounded-xl px-3 py-2 text-xs font-bold border border-gray-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {gpsPosition && <option value="gps">📍 Mi ubicación actual GPS</option>}
              {REFERENCE_ORIGINS.map(orig => (
                <option key={orig.id} value={orig.id}>{orig.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-2.5 px-4 flex items-center gap-2 shadow-xs">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar por nombre (ej. pizza, café, farmacia)..."
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') performSearch(); }}
              className="w-full text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-hidden"
            />
          </div>
          <button
            onClick={() => performSearch()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-2xl font-bold text-xs shadow-md transition-colors"
          >
            Buscar
          </button>
        </div>

        {/* Categories Carousel */}
        <div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SEARCH_CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.id && textQuery === '';
              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setTextQuery(''); }}
                  className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    isSelected 
                      ? 'bg-gray-900 text-white shadow-sm' 
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <cat.icon size={14} className={isSelected ? 'text-indigo-400' : 'text-gray-500'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Offline Notice Badge */}
        {!isOnline && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 px-4 flex items-center gap-2 text-xs text-orange-900 font-semibold">
            <WifiOff size={16} className="text-orange-600 shrink-0" />
            <span>Modo Offline: Mostrando lugares verificados y recomendaciones locales preparadas.</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-gray-600">Buscando lugares...</p>
          </div>
        )}

        {/* Error State */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs text-rose-800 flex items-center gap-2 font-medium">
            <AlertCircle size={16} className="text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Places Result List */}
        {!isLoading && places.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 pl-1">
              {places.length} resultados encontrados
            </p>

            {places.map(place => {
              const dist = LocationService.distanceTo(activeCoords.lat, activeCoords.lng, place.lat, place.lng);
              const walkingMin = Math.round(dist / 80); // ~80 meters per minute

              return (
                <div 
                  key={place.id}
                  onClick={() => setSelectedPlace(place)}
                  className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:border-indigo-200 transition-all cursor-pointer flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-indigo-600">
                        {place.category || 'Servicio'}
                      </span>
                      <h3 className="font-extrabold text-gray-900 text-base leading-tight mt-0.5">
                        {place.name}
                      </h3>
                      {place.address && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin size={12} className="shrink-0 text-gray-400" />
                          <span className="line-clamp-1">{place.address}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg inline-block">
                        ~{walkingMin} min
                      </span>
                      <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                        {Math.round(dist)} m
                      </p>
                    </div>
                  </div>

                  {place.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed">
                      {place.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs">
                    <div className="flex items-center gap-2">
                      {place.rating && (
                        <span className="font-bold text-amber-600 flex items-center gap-0.5">
                          ★ {place.rating}
                        </span>
                      )}
                      {place.priceLevel && (
                        <span className="text-gray-500 font-semibold">{place.priceLevel}</span>
                      )}
                    </div>
                    <span className="text-indigo-600 font-bold hover:underline">
                      Ver detalle →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && places.length === 0 && (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
            <Search size={32} className="text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">No se encontraron lugares</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
              Intenta cambiar la categoría, seleccionar otro punto de referencia o buscar otro término.
            </p>
            <button
              onClick={() => { setTextQuery(''); setSelectedCategory('restaurant'); performSearch(); }}
              className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
            >
              Restablecer búsqueda
            </button>
          </div>
        )}
      </div>

      {/* Selected Place Detail Modal/Card */}
      {selectedPlace && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-lg">
            <PlaceDetailCard
              place={selectedPlace}
              distanceMeters={LocationService.distanceTo(activeCoords.lat, activeCoords.lng, selectedPlace.lat, selectedPlace.lng)}
              walkingMinutes={Math.round(LocationService.distanceTo(activeCoords.lat, activeCoords.lng, selectedPlace.lat, selectedPlace.lng) / 80)}
              onClose={() => setSelectedPlace(null)}
              onNavigate={() => navigate(`/mapa`)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
