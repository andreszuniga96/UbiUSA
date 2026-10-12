import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTripStore } from '../../stores/useTripStore';
import { useTimelineEvents, useTours } from '../../hooks/useTripData';
import { GoogleMapsLoader, GoogleMapsLifecycleState, GoogleMapsDiagnosticInfo } from '../../services/GoogleMapsLoader';
import { GoogleMapsProvider } from '../../services/GoogleMapsProvider';
import { MapContextEngine } from '../../services/MapContextEngine';
import { LocationService, Position } from '../../services/LocationService';
import { PlaceDetailCard } from '../components/PlaceDetailCard';
import { Place } from '../../domain/types';
import { VERIFIED_TOURS_DATA } from '../../data/seed/verifiedToursData';
import { 
  Navigation, RefreshCw, AlertTriangle, 
  WifiOff, ChevronDown, CheckCircle2, Info, Compass 
} from 'lucide-react';

export default function MapPage() {
  const isOnline = useTripStore(state => state.isOnline);
  const events = useTimelineEvents();
  const allTours = useTours();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tourParam = searchParams.get('tourId');
  const dateParam = searchParams.get('date');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<GoogleMapsProvider | null>(null);

  // Estados reales del mapa: NOT_CONFIGURED | LOADING | API_READY | MAP_INITIALIZED | BASEMAP_RENDERED | ERROR
  const [mapLifecycleState, setMapLifecycleState] = useState<GoogleMapsLifecycleState>(
    GoogleMapsLoader.isConfigured() ? 'LOADING' : 'NOT_CONFIGURED'
  );
  const [diagnosticInfo, setDiagnosticInfo] = useState<GoogleMapsDiagnosticInfo | null>(null);
  const [showDiagModal, setShowDiagModal] = useState(false);

  const [userPosition, setUserPosition] = useState<Position | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(dateParam || 'ALL');
  const [selectedTourId, setSelectedTourId] = useState<string>(tourParam || 'ALL');
  const [selectedLayer, setSelectedLayer] = useState<'ALL' | 'TOURS' | 'ACCOMMODATION' | 'TRANSPORT'>('ALL');

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedPlaceDistance, setSelectedPlaceDistance] = useState<number | undefined>(undefined);

  // Actualizar diagnóstico técnico
  const refreshDiagnostics = useCallback(() => {
    const diag = GoogleMapsLoader.getDiagnosticInfo(mapContainerRef.current);
    if (providerRef.current) {
      diag.lifecycleState = providerRef.current.getLifecycleState();
    }
    setDiagnosticInfo(diag);
  }, []);

  // Inicializar y Renderizar Mapa con validación de cartografía real
  const initMap = useCallback(async () => {
    if (!isOnline) {
      setMapLifecycleState('NOT_CONFIGURED');
      refreshDiagnostics();
      return;
    }

    setMapLifecycleState('LOADING');
    refreshDiagnostics();

    try {
      await GoogleMapsLoader.load();
      setMapLifecycleState('API_READY');
      refreshDiagnostics();

      if (!mapContainerRef.current) {
        throw new Error("El contenedor del mapa no está montado en el DOM.");
      }

      // Check container size
      if (mapContainerRef.current.clientWidth === 0 || mapContainerRef.current.clientHeight === 0) {
        console.warn("[MapPage] El contenedor del mapa tiene dimensiones 0. Esperando layout...");
        await new Promise(r => setTimeout(r, 200));
      }

      let provider = providerRef.current;
      if (!provider) {
        provider = new GoogleMapsProvider();
        providerRef.current = provider;

        // Suscribirse a cambios reales de ciclo de vida (MAP_INITIALIZED -> BASEMAP_RENDERED)
        provider.onLifecycleStateChange((newState) => {
          setMapLifecycleState(newState);
          refreshDiagnostics();
        });
      }

      await provider.renderMap(mapContainerRef.current);
      refreshDiagnostics();
    } catch (err: any) {
      console.error("[MapPage] Error al inicializar Google Maps:", err);
      setMapLifecycleState('ERROR');
      refreshDiagnostics();
    }
  }, [isOnline, refreshDiagnostics]);

  // Initial load
  useEffect(() => {
    initMap();
    return () => {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
    };
  }, [initMap]);

  // Update Markers & Viewport based on selected context
  useEffect(() => {
    const provider = providerRef.current;
    if ((mapLifecycleState !== 'BASEMAP_RENDERED' && mapLifecycleState !== 'MAP_INITIALIZED') || !provider) return;

    provider.clearMarkers();
    provider.clearRoute();

    // Filter events
    let filteredEvents = events;
    if (selectedDate !== 'ALL') {
      filteredEvents = events.filter(e => e.date === selectedDate);
    }

    const context = MapContextEngine.evaluate({
      currentDate: selectedDate !== 'ALL' ? selectedDate : undefined,
      currentLocation: userPosition ? { lat: userPosition.lat, lng: userPosition.lng } : null,
      selectedTourId: selectedTourId !== 'ALL' ? selectedTourId : undefined,
      dayEvents: filteredEvents,
      allTours,
      activeCategoryFilter: selectedLayer,
    });

    // Apply layer filter
    const activeMarkers = context.markers.filter(m => {
      if (selectedLayer === 'ALL') return true;
      if (selectedLayer === 'TOURS') return m.type === 'TOUR_STOP' || m.type === 'MEETING_POINT';
      if (selectedLayer === 'ACCOMMODATION') return m.type === 'ACCOMMODATION';
      if (selectedLayer === 'TRANSPORT') return m.type === 'TRANSIT';
      return true;
    });

    // Add markers with click listener to open PlaceDetailCard
    activeMarkers.forEach(m => {
      provider.addMarker({
        ...m,
        clickAction: () => {
          // Find matching Place
          let placeMatch: Place | null = null;

          // Check if it's a tour stop
          for (const bundle of Object.values(VERIFIED_TOURS_DATA)) {
            const stop = bundle.stops.find(s => s.id === m.id);
            if (stop) {
              placeMatch = {
                id: stop.id,
                name: stop.name,
                address: stop.address,
                lat: stop.lat,
                lng: stop.lng,
                precision: 'exacto',
                source: stop.source as any,
                category: `Parada ${stop.order} · ${bundle.tour.title}`,
                description: stop.description,
                history: stop.history,
                highlights: stop.whatToSee,
                funFact: stop.funFact,
                photoTip: stop.photoTip,
              };
              break;
            }

            if (m.type === 'MEETING_POINT' && bundle.tour.id === m.entityId) {
              placeMatch = bundle.meetingPointPlace;
              break;
            }
          }

          if (!placeMatch) {
            placeMatch = {
              id: m.id,
              name: m.title,
              address: m.subtitle,
              lat: m.position.lat,
              lng: m.position.lng,
              precision: 'exacto',
              source: 'CURATED',
              category: m.type,
            };
          }

          setSelectedPlace(placeMatch);

          if (userPosition) {
            const dist = LocationService.distanceTo(
              userPosition.lat, userPosition.lng,
              placeMatch.lat, placeMatch.lng
            );
            setSelectedPlaceDistance(dist);
          } else {
            setSelectedPlaceDistance(undefined);
          }
        }
      });
    });

    // Draw route if present
    if (context.routes && context.routes.length > 1) {
      provider.drawRoute(context.routes);
    }

    // Set viewport
    if (activeMarkers.length > 0) {
      provider.fitToMarkers();
    } else {
      provider.setCenter(context.viewport.center.lat, context.viewport.center.lng);
      provider.setZoom(context.viewport.zoom);
    }
  }, [mapLifecycleState, events, allTours, selectedDate, selectedTourId, selectedLayer, userPosition]);

  // Handle GPS location request
  const handleLocateMe = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const pos = await LocationService.getCurrentPosition();
      setUserPosition(pos);
      if (providerRef.current) {
        providerRef.current.setCenter(pos.lat, pos.lng);
        providerRef.current.setZoom(16);
      }
    } catch (err: any) {
      console.warn("GPS error", err);
      setLocationError("No se pudo obtener la ubicación GPS (permiso denegado o timeout).");
    } finally {
      setIsLocating(false);
    }
  };

  // Distinct dates from events
  const availableDates = Array.from(new Set(events.map(e => e.date))).sort();

  return (
    <div className="h-full flex flex-col relative z-0 bg-gray-100 overflow-hidden">
      {/* Top Controls Bar */}
      <div className="bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-200/80 shadow-xs z-20 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-1.5">
              <Compass size={20} className="text-indigo-600" />
              Mapa de Viaje
            </h2>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide border ${
              isOnline && mapLifecycleState === 'BASEMAP_RENDERED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : isOnline && (mapLifecycleState === 'MAP_INITIALIZED' || mapLifecycleState === 'API_READY' || mapLifecycleState === 'LOADING')
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : !isOnline 
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {isOnline && mapLifecycleState === 'BASEMAP_RENDERED' 
                ? '● GOOGLE MAPS ACTIVO' 
                : isOnline && (mapLifecycleState === 'MAP_INITIALIZED' || mapLifecycleState === 'API_READY' || mapLifecycleState === 'LOADING')
                  ? '◐ CARGANDO CARTOGRAFÍA...' 
                  : !isOnline 
                    ? '○ OFFLINE' 
                    : '✕ ERROR CARTOGRAFÍA'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { refreshDiagnostics(); setShowDiagModal(true); }}
              className="p-1.5 px-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 transition-colors"
              title="Ver Diagnóstico Técnico de Google Maps"
            >
              <Info size={14} className="text-indigo-600" />
              <span className="hidden sm:inline">Diagnóstico</span>
            </button>

            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                userPosition 
                  ? 'bg-indigo-600 text-white shadow-indigo-600/20' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
              title="Centrar en mi ubicación GPS"
            >
              <Navigation size={15} className={isLocating ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{userPosition ? 'GPS Activo' : 'GPS'}</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Date / Tour / Layer */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          {/* Date Selector */}
          <div className="relative shrink-0">
            <select
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedTourId('ALL'); }}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 pr-7 font-bold text-gray-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">📅 Todos los días</option>
              {availableDates.map(d => (
                <option key={d} value={d}>
                  {new Date(`${d}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Tour Selector */}
          <div className="relative shrink-0">
            <select
              value={selectedTourId}
              onChange={(e) => setSelectedTourId(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 pr-7 font-bold text-gray-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 max-w-[170px] truncate"
            >
              <option value="ALL">🎯 Todos los tours</option>
              {allTours.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Layer Pills */}
          <div className="flex gap-1 shrink-0 ml-auto">
            {(['ALL', 'TOURS', 'ACCOMMODATION', 'TRANSPORT'] as const).map(layer => (
              <button
                key={layer}
                onClick={() => setSelectedLayer(layer)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  selectedLayer === layer 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {layer === 'ALL' ? 'Todos' : layer === 'TOURS' ? 'Tours' : layer === 'ACCOMMODATION' ? 'Hotel' : 'Bus'}
              </button>
            ))}
          </div>
        </div>

        {locationError && (
          <div className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">
            {locationError}
          </div>
        )}
      </div>

      {/* Main Map Canvas Area */}
      <div className="flex-1 relative z-0">
        {/* Map Container element is ALWAYS rendered in DOM */}
        <div 
          ref={mapContainerRef} 
          id="google-maps-canvas"
          className="w-full h-full min-h-[400px]"
        />

        {/* Loading Overlay */}
        {(mapLifecycleState === 'LOADING' || mapLifecycleState === 'API_READY') && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-4"></div>
            <h3 className="text-base font-bold text-gray-900">Iniciando Google Maps Platform...</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Cargando bibliotecas Maps, Marker, Places y Routes para el viaje...
            </p>
          </div>
        )}

        {/* Offline Overlay */}
        {!isOnline && (
          <div className="absolute inset-0 bg-gray-50/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-10">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
              <WifiOff size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Google Maps no está disponible sin conexión</h3>
            <p className="text-sm text-gray-600 max-w-md leading-relaxed mb-6">
              Para garantizar una experiencia honesta: Google Maps requiere conexión online para renderizar su cartografía oficial.
              Puedes consultar tus rutas preparadas y las paradas de tours en el <strong>Modo Tour</strong> o en el <strong>Itinerario</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/itinerario')}
                className="bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md hover:bg-indigo-700 transition-colors"
              >
                Ver Itinerario Offline
              </button>
            </div>
          </div>
        )}

        {/* Error Overlay with honest diagnosis preview */}
        {isOnline && mapLifecycleState === 'ERROR' && (
          <div className="absolute inset-0 bg-rose-50/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-10">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-rose-950 mb-2">Cartografía de Google Maps no disponible</h3>
            <p className="text-sm text-rose-800 max-w-md leading-relaxed mb-4">
              {providerRef.current?.getBasemapError() || diagnosticInfo?.diagnosticDetails || 'Google Maps se ha inicializado, pero la cartografía no está disponible.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => initMap()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-md transition-colors"
              >
                <RefreshCw size={15} /> Reintentar
              </button>
              <button
                onClick={() => setShowDiagModal(true)}
                className="bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Ver Diagnóstico Detallado
              </button>
            </div>
          </div>
        )}

        {/* Selected Place Detail Card Drawer */}
        {selectedPlace && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-30">
            <PlaceDetailCard
              place={selectedPlace}
              distanceMeters={selectedPlaceDistance}
              walkingMinutes={selectedPlaceDistance ? Math.round(selectedPlaceDistance / 80) : undefined}
              onClose={() => setSelectedPlace(null)}
              onNavigate={() => {
                if (userPosition && providerRef.current) {
                  providerRef.current.calculateAndDrawRoute(
                    { lat: userPosition.lat, lng: userPosition.lng },
                    { lat: selectedPlace.lat, lng: selectedPlace.lng },
                    'WALKING'
                  );
                }
              }}
              onFindNearby={(cat) => navigate(`/explorar/nearby?category=${cat}`)}
            />
          </div>
        )}
      </div>

      {/* Google Maps Diagnostic Modal */}
      {showDiagModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                <Info size={20} className="text-indigo-600" />
                Diagnóstico Google Maps Platform
              </h3>
              <button 
                onClick={() => setShowDiagModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-gray-50 p-4 rounded-2xl space-y-2 border border-gray-100">
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="font-bold text-gray-600">VITE_GOOGLE_MAPS_API_KEY:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${diagnosticInfo?.apiKeyPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {diagnosticInfo?.apiKeyPresent ? 'PRESENTE (Protegida)' : 'NO CONFIGURADA'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="font-bold text-gray-600">VITE_GOOGLE_MAPS_MAP_ID:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${diagnosticInfo?.mapIdPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {diagnosticInfo?.mapIdPresent ? 'CONFIGURADO' : 'NO ASIGNADO'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="font-bold text-gray-600">ESTADO DEL CICLO DE VIDA:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                    mapLifecycleState === 'BASEMAP_RENDERED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : mapLifecycleState === 'ERROR'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}>
                    {mapLifecycleState}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="font-bold text-gray-600">CARTOGRAFÍA CONFIRMADA:</span>
                  <span className={`font-bold ${providerRef.current?.isBasemapRendered() ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {providerRef.current?.isBasemapRendered() ? 'SÍ (tilesloaded verificado)' : 'PENDIENTE / CARGANDO'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="font-bold text-gray-600">BIBLIOTECA MAPS CARGADA:</span>
                  <span className={`font-bold ${diagnosticInfo?.mapsApiLoaded ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {diagnosticInfo?.mapsApiLoaded ? 'SÍ' : 'NO'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="font-bold text-gray-600">DIMENSIONES DEL CONTENEDOR:</span>
                  <span className={`font-bold ${diagnosticInfo?.mapContainerHasSize ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {diagnosticInfo?.mapContainerHasSize ? 'OK (Con tamaño)' : 'SIN TAMAÑO'}
                  </span>
                </div>
                {diagnosticInfo?.lastMapsAuthError && (
                  <div className="py-2 border-b border-gray-200/50 text-rose-700">
                    <p className="font-bold">Error de Autenticación de Google:</p>
                    <p className="font-mono text-[11px] mt-0.5">{diagnosticInfo.lastMapsAuthError}</p>
                  </div>
                )}
                {diagnosticInfo?.lastApiError && (
                  <div className="py-2 text-rose-700">
                    <p className="font-bold">Detalle del Error:</p>
                    <p className="font-mono text-[11px] mt-0.5">{diagnosticInfo.lastApiError}</p>
                  </div>
                )}
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                <h4 className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-indigo-600" />
                  Requisitos de Google Cloud Console
                </h4>
                <p className="text-indigo-900 leading-relaxed mb-2">
                  Asegúrate de tener habilitadas en tu proyecto de Google Cloud:
                </p>
                <ul className="list-disc list-inside space-y-1 text-indigo-950 font-medium">
                  <li><strong>Maps JavaScript API</strong> (Mapa y marcadores)</li>
                  <li><strong>Places API (New)</strong> (Búsqueda de lugares y Nearby)</li>
                  <li><strong>Routes API / Directions API</strong> (Cálculo de rutas a pie/tránsito)</li>
                  <li><strong>Geocoding API</strong> (Resolución de coordenadas)</li>
                </ul>
                <p className="text-indigo-900 mt-2 text-[11px]">
                  Si tu clave tiene restricciones de HTTP Referrer, agrega <code>http://localhost:4173/*</code> y <code>http://localhost:5173/*</code>.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => { setShowDiagModal(false); initMap(); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
              >
                Reintentar Carga
              </button>
              <button
                onClick={() => setShowDiagModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
