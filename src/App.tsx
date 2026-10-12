import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Dashboard from './ui/pages/Dashboard';
import Itinerary from './ui/pages/Itinerary';
import MapPage from './ui/pages/MapPage';
import PrepareOffline from './ui/pages/PrepareOffline';
import DayDetail from './ui/pages/DayDetail';
import ExploreCity from './ui/pages/ExploreCity';
import Reservations from './ui/pages/Reservations';
import TasksPage from './ui/pages/TasksPage';
import TourMode from './ui/pages/TourMode';
import MapDiagnostics from './ui/pages/MapDiagnostics';
import { TripRepository } from './data/repository';
import { Map, Calendar, Compass, ListTodo, Backpack, WifiOff, Ticket } from 'lucide-react';
import { useTripStore } from './stores/useTripStore';

function Navigation() {
  const location = useLocation();
  const getNavClass = (path: string) => 
    `flex flex-col items-center justify-center flex-1 font-medium text-[10px] py-2 transition-colors ${location.pathname === path || (path !== '/' && location.pathname.startsWith(path)) ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`;

  return (
    <nav className="bg-white/90 backdrop-blur-md border-t border-gray-100 flex justify-around pb-safe shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-50">
      <Link to="/" className={getNavClass('/')}>
        <Compass size={20} className="mb-1" />
        <span>Hoy</span>
      </Link>
      <Link to="/itinerario" className={getNavClass('/itinerario')}>
        <Calendar size={20} className="mb-1" />
        <span>Itinerario</span>
      </Link>
      <Link to="/mapa" className={getNavClass('/mapa')}>
        <Map size={20} className="mb-1" />
        <span>Mapa</span>
      </Link>
      <Link to="/reservas" className={getNavClass('/reservas')}>
        <Ticket size={20} className="mb-1" />
        <span>Reservas</span>
      </Link>
      <Link to="/tareas" className={getNavClass('/tareas')}>
        <ListTodo size={20} className="mb-1" />
        <span>Pendientes</span>
      </Link>
    </nav>
  );
}

export default function App() {
  const { isOnline, setOnline } = useTripStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    TripRepository.seedIfEmpty().then(() => {
      setIsReady(true);
    }).catch(console.error);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white flex-col gap-4">
        <Backpack size={48} className="animate-bounce text-indigo-500" />
        <h1 className="font-bold text-xl tracking-wider">UbiUSA</h1>
        <p className="text-gray-400 text-sm">Cargando inteligencia de viaje...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col h-[100dvh] bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth bg-gray-50/50">
          {!isOnline && (
            <div className="absolute top-0 left-0 right-0 z-50 bg-orange-500 text-white text-xs font-bold text-center py-1 flex items-center justify-center gap-2 shadow-md">
              <WifiOff size={14} /> MODO OFFLINE ACTIVO
            </div>
          )}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/itinerario" element={<Itinerary />} />
            <Route path="/itinerario/:date" element={<DayDetail />} />
            <Route path="/mapa" element={<MapPage />} />
            <Route path="/explorar/:city" element={<ExploreCity />} />
            <Route path="/reservas" element={<Reservations />} />
            <Route path="/tareas" element={<TasksPage />} />
            <Route path="/prep" element={<PrepareOffline />} />
            <Route path="/tour/:id" element={<TourMode />} />
            <Route path="/diagnostico-mapa" element={<MapDiagnostics />} />
            <Route path="/pendientes" element={<Navigate to="/tareas" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <Navigation />
      </div>
    </BrowserRouter>
  );
}
