import { Link } from 'react-router-dom';
import { useTimelineEvents, useDays } from '../../hooks/useTripData';
import { 
  Calendar as CalendarIcon, 
  ArrowRight, 
  Plane, 
  Building, 
  Ticket, 
  Bus, 
  MapPin,
  Play
} from 'lucide-react';

export default function Itinerary() {
  const events = useTimelineEvents();
  const days = useDays();

  // Create map of days for quick city lookup
  const dayCityMap = new Map<string, string>();
  days.forEach(d => dayCityMap.set(d.date, d.city));

  const grouped = events.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  const sortedDates = Object.keys(grouped).sort();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmado': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'planificado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pendiente': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'pendiente_compra': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'flight': return <Plane size={14} className="text-blue-500" />;
      case 'accommodation': return <Building size={14} className="text-emerald-500" />;
      case 'transport': return <Bus size={14} className="text-orange-500" />;
      case 'activity':
      default: return <Ticket size={14} className="text-indigo-500" />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-28">
      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 px-4 py-5 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon size={24} className="text-indigo-400" />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Itinerario Completo</h1>
              <p className="text-xs text-slate-400 font-medium">18 días · Octubre 12 - 29, 2026</p>
            </div>
          </div>
          <Link
            to="/mapa"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
          >
            <MapPin size={13} /> Ver Mapa
          </Link>
        </div>
      </header>

      {/* Days List */}
      <main className="max-w-2xl mx-auto p-4 space-y-4 mt-2">
        {sortedDates.map((date, index) => {
          const dayEvents = grouped[date];
          const parsedDate = new Date(`${date}T00:00:00`);
          const city = dayCityMap.get(date) || (dayEvents[0] as any)?.city || 'Estados Unidos';

          return (
            <div 
              key={date} 
              className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden transition-all hover:shadow-md"
            >
              {/* Day Header */}
              <div className="bg-indigo-50/60 p-4 border-b border-indigo-100/60 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase">
                      Día {index + 1}
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900 capitalize">
                      {parsedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </h2>
                  </div>
                  <p className="text-xs text-indigo-700 font-bold mt-1 flex items-center gap-1">
                    <MapPin size={12} /> {city}
                  </p>
                </div>

                <Link 
                  to={`/itinerario/${date}`} 
                  className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-xs hover:bg-indigo-50 transition-colors shrink-0"
                >
                  <ArrowRight size={18} />
                </Link>
              </div>

              {/* Day Events Preview */}
              <div className="p-4 space-y-3">
                {dayEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        {getEventIcon(event.type)}
                      </span>
                      <span className="font-mono font-bold text-slate-500 shrink-0">
                        {event.localTime || '--:--'}
                      </span>
                      <p className="font-semibold text-slate-800 truncate">
                        {event.type === 'flight' ? `Vuelo ${event.airline}` :
                         event.type === 'accommodation' ? `Alojamiento: ${(event as any).city}` :
                         event.type === 'transport' ? `Transporte a ${(event as any).destination}` :
                         (event as any).title || 'Actividad'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {(event as any).isTour && (
                        <Link
                          to={`/tour/${event.id}`}
                          className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-extrabold flex items-center gap-0.5"
                        >
                          <Play size={9} fill="currentColor" /> Tour
                        </Link>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${getStatusColor(event.status)}`}>
                        {event.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
