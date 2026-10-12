import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTimelineEvents, useDays } from '../../hooks/useTripData';
import { 
  ChevronLeft, 
  MapPin, 
  Clock, 
  Info, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  ArrowRight, 
  Play
} from 'lucide-react';

export default function DayDetail() {
  const { date } = useParams();
  const navigate = useNavigate();
  const allEvents = useTimelineEvents();
  const days = useDays();

  if (!date) return <div className="p-8 text-center text-slate-500">Día no especificado</div>;

  const dayPlan = days.find(d => d.date === date);
  const dayEvents = allEvents.filter(e => e.date === date).sort((a, b) => {
    const timeA = a.localTime || '99:99';
    const timeB = b.localTime || '99:99';
    return timeA.localeCompare(timeB);
  });

  const parsedDate = new Date(`${date}T00:00:00`);
  const formattedDate = parsedDate.toLocaleDateString('es-ES', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });

  const city = dayPlan?.city || (dayEvents[0] as any)?.city || 'Estados Unidos';

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmado': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'planificado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pendiente': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'pendiente_compra': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'confirmado': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'planificado': return <Circle size={14} className="text-blue-500" />;
      default: return <AlertCircle size={14} className="text-rose-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white px-4 py-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="font-extrabold text-base capitalize leading-tight">{formattedDate}</h1>
              <p className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                <MapPin size={11} /> {city}
              </p>
            </div>
          </div>
          <Link
            to={`/mapa?date=${date}`}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
          >
            <MapPin size={12} /> Ver en Mapa
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-4 space-y-4 mt-2">
        {/* Day Summary Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex justify-between items-center">
          <div>
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block">
              Actividades del Día
            </span>
            <p className="text-2xl font-extrabold text-slate-900">{dayEvents.length} eventos</p>
          </div>
          <Link
            to="/explorar/nearby"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Comida y Café Cercanos
          </Link>
        </div>

        {/* Timeline Events */}
        <section className="space-y-4">
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1">
            Cronograma del Día
          </h2>

          <div className="space-y-3">
            {dayEvents.map((event) => {
              const isTour = event.type === 'tour' || (event.type === 'activity' && (event as any).isTour);

              return (
                <div 
                  key={event.id} 
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-extrabold text-indigo-600 text-sm">
                          {event.localTime || 'Horario Flexible'}
                        </span>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${getStatusColor(event.status)}`}>
                          {getStatusIcon(event.status)}
                          {event.status.replace('_', ' ')}
                        </div>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                        {event.type === 'flight' ? `Vuelo ${event.airline}` :
                         event.type === 'accommodation' ? `Check-in: ${(event as any).city}` :
                         event.type === 'transport' ? `Transporte a ${(event as any).destination}` :
                         (event as any).title || 'Actividad'}
                      </h3>
                    </div>
                  </div>

                  {(event as any).meetingPoint && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700 flex items-center gap-2">
                      <MapPin size={13} className="text-indigo-600 shrink-0" />
                      <span>Punto de encuentro: <strong>{(event as any).meetingPoint}</strong></span>
                    </div>
                  )}

                  {event.notes && (
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-xs text-amber-900 flex items-start gap-2 font-medium">
                      <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>{event.notes}</span>
                    </div>
                  )}

                  {event.bookingCodes && event.bookingCodes.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-semibold">Reserva:</span>
                      <code className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-extrabold">
                        {event.bookingCodes.join(', ')}
                      </code>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    {isTour ? (
                      <Link 
                        to={`/tour/${event.id}`} 
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold text-center flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20"
                      >
                        <Play size={12} fill="currentColor" /> Iniciar Modo Tour en Vivo
                      </Link>
                    ) : (
                      <Link
                        to={`/mapa?date=${date}`}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold text-center"
                      >
                        Ver en Mapa
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {dayEvents.length === 0 && (
              <div className="bg-white p-8 rounded-3xl text-center border border-slate-100 shadow-sm">
                <Clock size={32} className="mx-auto text-slate-300 mb-2" />
                <h3 className="font-extrabold text-slate-800 text-sm mb-1">Día Libre de Actividades</h3>
                <p className="text-xs text-slate-500 mb-4">No hay tours programados en esta jornada.</p>
                <Link 
                  to="/explorar/nearby" 
                  className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Explorar Lugares Recomendados <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
