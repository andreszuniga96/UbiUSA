import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTour, useTourStops, useTourSession } from '../../hooks/useTripData';
import { LocationService, Position } from '../../services/LocationService';
import { TripRepository } from '../../data/repository';
import { GoogleMapsProvider } from '../../services/GoogleMapsProvider';
import { GoogleMapsLoader } from '../../services/GoogleMapsLoader';
import { useTripStore } from '../../stores/useTripStore';
import { 
  MapPin, Camera, Compass, Coffee, 
  CheckCircle2, Circle, Footprints, Play, Pause, Square, 
  Sparkles, Utensils, ShieldCheck, ChevronRight 
} from 'lucide-react';

export default function TourMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isOnline = useTripStore(state => state.isOnline);

  const tour = useTour(id);
  const tourStops = useTourStops(id);
  const existingSession = useTourSession(id);

  const [position, setPosition] = useState<Position | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [currentStopIndex, setCurrentStopIndex] = useState<number>(0);
  const [sessionStatus, setSessionStatus] = useState<'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'>('NOT_STARTED');
  const [completedStops, setCompletedStops] = useState<string[]>([]);
  const [showMap, setShowMap] = useState<boolean>(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapProviderRef = useRef<GoogleMapsProvider | null>(null);

  // Sync state from existingSession
  useEffect(() => {
    if (existingSession) {
      setCurrentStopIndex(existingSession.currentStopIndex || 0);
      setSessionStatus(existingSession.status === 'COMPLETED' ? 'COMPLETED' : (existingSession.status === 'ACTIVE' ? 'ACTIVE' : 'NOT_STARTED'));
      setCompletedStops(existingSession.completedStops || []);
    }
  }, [existingSession]);

  // Persist session to DB
  const persistSession = useCallback(async (
    status: 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED',
    stopIdx: number,
    completed: string[]
  ) => {
    if (!tour) return;
    await TripRepository.saveTourSession({
      id: `session-${tour.id}`,
      tourId: tour.id,
      activityId: tour.activityId || tour.id,
      currentStopIndex: stopIdx,
      completedStops: completed,
      status: status as any,
      currentLocation: position ? { lat: position.lat, lng: position.lng } : undefined,
      lastUpdated: Date.now(),
    });
  }, [tour, position]);

  // GPS Tracking
  useEffect(() => {
    if (sessionStatus === 'ACTIVE') {
      LocationService.watchPosition(
        (pos) => {
          setPosition(pos);
          setGpsError(null);
        },
        (err) => {
          console.warn('[TourMode] GPS Watch error:', err);
          setGpsError("Señal GPS débil o permiso no otorgado.");
        }
      );
    } else {
      LocationService.stopWatching();
    }
    return () => LocationService.stopWatching();
  }, [sessionStatus]);

  // Embedded Map initialization
  useEffect(() => {
    if (!isOnline || !showMap || tourStops.length === 0) return;

    let isMounted = true;
    GoogleMapsLoader.load().then(async () => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapProviderRef.current) {
        const provider = new GoogleMapsProvider();
        mapProviderRef.current = provider;
        await provider.renderMap(mapContainerRef.current, {
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
        });
      }

      const provider = mapProviderRef.current;
      provider.clearMarkers();
      provider.clearRoute();

      // Add stops markers
      const routeCoords: { lat: number; lng: number }[] = [];

      tourStops.forEach((stop, i) => {
        routeCoords.push({ lat: stop.lat, lng: stop.lng });
        provider.addMarker({
          id: stop.id,
          position: { lat: stop.lat, lng: stop.lng },
          title: `${stop.order}. ${stop.name}`,
          type: 'TOUR_STOP',
          stopOrder: stop.order,
          clickAction: () => setCurrentStopIndex(i),
        });
      });

      // Add user location marker
      if (position) {
        provider.addMarker({
          id: 'user-tour-pos',
          position: { lat: position.lat, lng: position.lng },
          title: 'Tu Posición',
          type: 'USER',
        });
      }

      // Draw tour route line
      if (routeCoords.length > 1) {
        provider.drawRoute(routeCoords);
      }

      // Center on active stop
      const currentStop = tourStops[currentStopIndex];
      if (currentStop) {
        provider.setCenter(currentStop.lat, currentStop.lng);
      }
    }).catch(err => console.warn("[TourMode] Mini map load error", err));

    return () => {
      isMounted = false;
    };
  }, [isOnline, showMap, tourStops, currentStopIndex, position]);

  // Stop Actions
  const handleStartTour = () => {
    setSessionStatus('ACTIVE');
    persistSession('ACTIVE', currentStopIndex, completedStops);
  };

  const handlePauseTour = () => {
    setSessionStatus('PAUSED');
    persistSession('PAUSED', currentStopIndex, completedStops);
  };

  const handleResumeTour = () => {
    setSessionStatus('ACTIVE');
    persistSession('ACTIVE', currentStopIndex, completedStops);
  };

  const handleFinishTour = () => {
    setSessionStatus('COMPLETED');
    persistSession('COMPLETED', currentStopIndex, completedStops);
  };

  const handleCompleteCurrentStop = () => {
    const currentStop = tourStops[currentStopIndex];
    if (!currentStop) return;

    const newCompleted = Array.from(new Set([...completedStops, currentStop.id]));
    setCompletedStops(newCompleted);

    if (currentStopIndex < tourStops.length - 1) {
      const nextIdx = currentStopIndex + 1;
      setCurrentStopIndex(nextIdx);
      persistSession(sessionStatus, nextIdx, newCompleted);
    } else {
      setSessionStatus('COMPLETED');
      persistSession('COMPLETED', currentStopIndex, newCompleted);
    }
  };

  const activeStop = tourStops[currentStopIndex] || tourStops[0];
  const nextStop = currentStopIndex < tourStops.length - 1 ? tourStops[currentStopIndex + 1] : null;

  // Calculate distance in meters to active stop
  let distanceToActive = 0;
  if (position && activeStop) {
    distanceToActive = LocationService.distanceTo(position.lat, position.lng, activeStop.lat, activeStop.lng);
  }

  if (!tour && tourStops.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Cargando Tour Inteligente...</h2>
        <p className="text-sm text-gray-500 mb-4">Recuperando paradas verificadas desde la base de datos...</p>
        <button onClick={() => navigate(-1)} className="bg-gray-200 px-4 py-2 rounded-xl text-xs font-bold">
          ← Volver
        </button>
      </div>
    );
  }

  const progressPercent = tourStops.length > 0 ? Math.round((completedStops.length / tourStops.length) * 100) : 0;

  return (
    <div className="pb-28 bg-gray-50 min-h-screen">
      {/* Hero Header */}
      <div className="bg-gray-900 text-white p-6 pb-10 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <Link to="/" className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-colors">
              ← Salir del Modo Tour
            </Link>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
              sessionStatus === 'ACTIVE' 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse'
                : sessionStatus === 'COMPLETED'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-gray-700 text-gray-300 border-gray-600'
            }`}>
              {sessionStatus === 'ACTIVE' ? 'EN VIVO' : sessionStatus === 'COMPLETED' ? 'FINALIZADO' : 'PREPARADO'}
            </span>
            {gpsError && (
              <span className="text-[10px] text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded-md">
                {gpsError}
              </span>
            )}
          </div>

          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-400 font-bold tracking-widest text-[10px] uppercase mb-1 flex items-center gap-1">
                <ShieldCheck size={12} /> {tour?.provider || 'GURUWALK VERIFICADO'}
              </p>
              <h1 className="text-2xl font-black tracking-tight leading-tight">
                {tour?.title || 'Tour Guiado'}
              </h1>
              {tour?.city && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 font-semibold">
                  <MapPin size={12} className="text-indigo-400" /> {tour.city}
                </p>
              )}
            </div>
          </div>

          {/* Session Controls */}
          <div className="mt-5 flex gap-2">
            {sessionStatus === 'NOT_STARTED' && (
              <button
                onClick={handleStartTour}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Play size={16} fill="white" /> INICIAR TOUR EN VIVO
              </button>
            )}

            {sessionStatus === 'ACTIVE' && (
              <>
                <button
                  onClick={handlePauseTour}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Pause size={14} /> Pausar
                </button>
                <button
                  onClick={handleFinishTour}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Square size={14} /> Finalizar
                </button>
              </>
            )}

            {sessionStatus === 'PAUSED' && (
              <button
                onClick={handleResumeTour}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Play size={16} fill="white" /> Reanudar Tour
              </button>
            )}

            {sessionStatus === 'COMPLETED' && (
              <div className="flex-1 bg-emerald-500/20 text-emerald-300 p-2.5 rounded-xl text-xs font-bold text-center border border-emerald-500/30">
                ¡Has completado este tour! 🎉
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-20 space-y-4">
        {/* Progress & Stops Selector Bar */}
        <div className="bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500 mb-3 px-1">
            <span>Progreso del recorrido</span>
            <span className="text-indigo-600 font-black">{progressPercent}% ({completedStops.length}/{tourStops.length})</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {tourStops.map((stop, idx) => {
              const isCompleted = completedStops.includes(stop.id);
              const isCurrent = idx === currentStopIndex;
              return (
                <button 
                  key={stop.id}
                  onClick={() => setCurrentStopIndex(idx)}
                  className={`flex flex-col items-center shrink-0 min-w-[50px] p-2 rounded-2xl transition-all ${
                    isCurrent 
                      ? 'bg-indigo-50 border-2 border-indigo-600' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="text-emerald-500" size={20} />
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                      {idx + 1}
                    </div>
                  ) : (
                    <Circle className="text-gray-300" size={20} />
                  )}
                  <span className={`text-[9px] font-bold mt-1 uppercase ${isCurrent ? 'text-indigo-700' : 'text-gray-400'}`}>
                    P.{idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Embedded Interactive Map */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <div className="p-3 px-5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500 flex items-center gap-1.5">
              <Compass size={14} className="text-indigo-600" /> Mapa del Recorrido
            </span>
            <button
              onClick={() => setShowMap(!showMap)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              {showMap ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showMap && (
            <div className="h-64 w-full relative">
              <div ref={mapContainerRef} className="w-full h-full" />
              {!isOnline && (
                <div className="absolute inset-0 bg-gray-50/90 flex flex-col items-center justify-center p-4 text-center">
                  <p className="text-xs font-bold text-gray-600">Mapa online no disponible offline.</p>
                  <p className="text-[11px] text-gray-400 mt-1">Sigue las instrucciones preparadas y distancias GPS abajo.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active Stop Card */}
        {activeStop && (
          <div className="space-y-4">
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start gap-2 mb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Parada {currentStopIndex + 1} de {tourStops.length}
                  </span>
                  <h2 className="text-xl font-black text-gray-900 leading-tight mt-1">
                    {activeStop.name}
                  </h2>
                </div>

                {position && (
                  <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shrink-0">
                    <Footprints size={14} />
                    {Math.round(distanceToActive)} m
                  </div>
                )}
              </div>

              {activeStop.address && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-4">
                  <MapPin size={12} className="text-gray-400 shrink-0" /> {activeStop.address}
                </p>
              )}

              <p className="text-gray-700 mb-6 text-sm leading-relaxed">
                {activeStop.description}
              </p>

              {/* Complete Stop Button */}
              <div className="flex gap-2">
                <button
                  onClick={handleCompleteCurrentStop}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <CheckCircle2 size={16} /> Marcar Parada como Visitada
                </button>
              </div>
            </section>

            {/* Next Stop Preview */}
            {nextStop && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-4 px-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Siguiente Parada</p>
                  <p className="text-sm font-extrabold text-indigo-950">{nextStop.order}. {nextStop.name}</p>
                </div>
                <button
                  onClick={() => setCurrentStopIndex(currentStopIndex + 1)}
                  className="w-9 h-9 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-xs hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* Historical Details & Trivia */}
            <div className="grid grid-cols-1 gap-3">
              {activeStop.history && (
                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-amber-800 mb-2 flex items-center gap-1.5">
                    <Compass size={14} /> Historia y Significado
                  </h3>
                  <p className="text-amber-950 text-sm leading-relaxed">{activeStop.history}</p>
                </div>
              )}

              {activeStop.whatToSee && activeStop.whatToSee.length > 0 && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-2 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-600" /> Qué Observar
                  </h3>
                  <ul className="space-y-1.5 text-xs text-gray-700">
                    {activeStop.whatToSee.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeStop.photoTip && (
                <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-rose-800 mb-2 flex items-center gap-1.5">
                    <Camera size={14} /> Consejo Fotográfico
                  </h3>
                  <p className="text-rose-950 text-sm leading-relaxed">{activeStop.photoTip}</p>
                </div>
              )}

              {activeStop.funFact && (
                <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-blue-800 mb-2 flex items-center gap-1.5">
                    <Sparkles size={14} /> Dato Curioso
                  </h3>
                  <p className="text-blue-950 text-sm leading-relaxed">{activeStop.funFact}</p>
                </div>
              )}
            </div>

            {/* Nearby shortcuts */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3 text-center">
                Servicios y Comida en los alrededores
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => navigate(`/explorar/nearby?category=cafe`)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Coffee size={16} /> Café Cerca
                </button>
                <button 
                  onClick={() => navigate(`/explorar/nearby?category=restaurant`)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-800 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Utensils size={16} /> Comida Cerca
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
