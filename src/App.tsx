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
import BudgetPage from './ui/pages/BudgetPage';
import ContingencyPage from './ui/pages/ContingencyPage';
import { TripRepository } from './data/repository';
import { Map, Calendar, Compass, Backpack, WifiOff, Ticket, Wallet, ShieldAlert } from 'lucide-react';
import { useTripStore } from './stores/useTripStore';

function Navigation() {
  const location = useLocation();
  const getNavClass = (path: string) => 
    `flex flex-col items-center justify-center flex-1 font-bold text-[10px] py-2 transition-all min-h-[48px] ${
      location.pathname === path || (path !== '/' && location.pathname.startsWith(path)) 
        ? 'text-indigo-600 scale-105' 
        : 'text-slate-400 hover:text-slate-600'
    }`;

  return (
    <nav className="bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-around pb-safe shrink-0 shadow-[0_-4px_25px_-10px_rgba(0,0,0,0.1)] z-50 px-1">
      <Link to="/" className={getNavClass('/')} aria-label="Ir al Copiloto de Hoy">
        <Compass size={20} className="mb-0.5" />
        <span>Hoy</span>
      </Link>
      <Link to="/itinerario" className={getNavClass('/itinerario')} aria-label="Ver Itinerario">
        <Calendar size={20} className="mb-0.5" />
        <span>Itinerario</span>
      </Link>
      <Link to="/mapa" className={getNavClass('/mapa')} aria-label="Ver Mapa Contextual">
        <Map size={20} className="mb-0.5" />
        <span>Mapa</span>
      </Link>
      <Link to="/reservas" className={getNavClass('/reservas')} aria-label="Ver Centro de Reservas">
        <Ticket size={20} className="mb-0.5" />
        <span>Reservas</span>
      </Link>
      <Link to="/presupuesto" className={getNavClass('/presupuesto')} aria-label="Ver Presupuesto y Gastos">
        <Wallet size={20} className="mb-0.5" />
        <span>Gastos</span>
      </Link>
      <Link to="/contingencia" className="flex flex-col items-center justify-center flex-1 font-extrabold text-[10px] py-2 text-rose-600 hover:text-rose-700 transition-all min-h-[48px]" aria-label="Modo Contingencia SOS">
        <ShieldAlert size={20} className="mb-0.5 text-rose-600 animate-pulse" />
        <span className="text-rose-600">SOS</span>
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
            <div className="sticky top-0 left-0 right-0 z-50 bg-amber-600 text-white text-xs font-bold text-center py-1.5 px-3 flex items-center justify-center gap-2 shadow-md">
              <WifiOff size={14} /> MODO OFFLINE ACTIVO · CONSULTANDO DATOS LOCALES EN INDEXEDDB
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
            <Route path="/presupuesto" element={<BudgetPage />} />
            <Route path="/contingencia" element={<ContingencyPage />} />
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
