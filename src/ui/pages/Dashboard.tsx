import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  useCriticalTasks, 
  useTimelineEvents, 
  useTravelAlerts, 
  useDays
} from '../../hooks/useTripData';
import { useTripStore } from '../../stores/useTripStore';
import { TripRepository } from '../../data/repository';
import { 
  AlertTriangle, 
  MapPin, 
  Footprints, 
  Plane, 
  Calendar, 
  Navigation, 
  CheckCircle2, 
  Circle, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Play
} from 'lucide-react';
import { TravelContextEngine } from '../../services/TravelContextEngine';

export default function Dashboard() {
  const tasks = useCriticalTasks();
  const events = useTimelineEvents();
  const alerts = useTravelAlerts();
  const days = useDays();
  const { isOnline } = useTripStore();

  // Mode: Pre-Trip vs In-Trip simulation
  const [selectedMode, setSelectedMode] = useState<'PRE_TRIP' | 'IN_TRIP'>('PRE_TRIP');
  const [simulatedDate, setSimulatedDate] = useState<string>('2026-10-16');
  const [simulatedHour, setSimulatedHour] = useState<string>('13:10');

  // Real or mock 'now' timestamp based on state
  const realNow = Date.now();
  const tripStartDate = new Date('2026-10-12T00:00:00');

  // Compute contexts
  const preTripContext = TravelContextEngine.evaluatePreTrip(realNow, alerts, tasks);

  const simulatedTimeMs = new Date(`${simulatedDate}T${simulatedHour}:00`).getTime();
  const inTripContext = TravelContextEngine.evaluateInTrip(
    simulatedDate,
    simulatedTimeMs,
    events,
    alerts
  );

  const toggleTask = async (id: string, currentStatus: string) => {
    try {
      await TripRepository.updateTaskStatus(id, currentStatus === 'DONE' ? 'PENDING' : 'DONE');
    } catch (e) {
      console.error('Error toggling task:', e);
    }
  };

  const getDayNumber = (dateStr: string) => {
    const diff = new Date(`${dateStr}T00:00:00`).getTime() - tripStartDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Top App Bar & Status */}
      <header className="bg-slate-900 text-white pt-5 pb-8 px-4 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-20 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Header row */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                UbiUSA · Travel Intelligence
              </span>
            </div>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border shadow-sm ${
              isOnline 
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              {isOnline ? '● ONLINE' : '○ MODO OFFLINE'}
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl flex gap-1 mb-5 border border-slate-700/60">
            <button
              onClick={() => setSelectedMode('PRE_TRIP')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                selectedMode === 'PRE_TRIP'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar size={14} />
              Pre-Viaje (Preparación)
            </button>
            <button
              onClick={() => setSelectedMode('IN_TRIP')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                selectedMode === 'IN_TRIP'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Navigation size={14} />
              En Ruta (Simulador en Vivo)
            </button>
          </div>

          {/* Dynamic Header Titles */}
          {selectedMode === 'PRE_TRIP' ? (
            <div>
              <p className="text-indigo-400 font-bold tracking-wider text-xs uppercase mb-1">
                Viajeros: Iván & Gloria · 12 al 29 de Octubre 2026
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                Preparación para Estados Unidos
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm">
                Faltan <strong className="text-white font-bold">{preTripContext.daysUntilTrip} días</strong> para el despegue desde Cali (CLO).
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <p className="text-indigo-400 font-bold tracking-wider text-xs uppercase">
                    Día {getDayNumber(simulatedDate)} de 18 · {inTripContext.city}
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {new Date(`${simulatedDate}T00:00:00`).toLocaleDateString('es-ES', { 
                      weekday: 'short', day: 'numeric', month: 'long' 
                    })}
                  </h1>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-semibold">Hora sim:</span>
                  <span className="text-lg font-mono font-extrabold text-amber-300">{simulatedHour}</span>
                </div>
              </div>

              {/* Day & Hour Controls */}
              <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-800/90 p-2.5 rounded-2xl border border-slate-700">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Día del Viaje</label>
                  <select
                    value={simulatedDate}
                    onChange={(e) => setSimulatedDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {days.map((d) => (
                      <option key={d.date} value={d.date}>
                        Día {getDayNumber(d.date)}: {d.date.slice(5)} ({d.city.split('/')[0].slice(0, 15)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Hora simulada</label>
                  <select
                    value={simulatedHour}
                    onChange={(e) => setSimulatedHour(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="08:30">08:30 (Mañana / Salida)</option>
                    <option value="11:45">11:45 (Mediodía / Almuerzo)</option>
                    <option value="13:10">13:10 (Tarde temprana / Tour)</option>
                    <option value="16:45">16:45 (Tarde)</option>
                    <option value="19:30">19:30 (Noche / Cena)</option>
                    <option value="23:30">23:30 (Noche / Traslados)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 -mt-4 relative z-20 space-y-5">
        
        {/* ========================================================= */}
        {/* MODO PRE-VIAJE                                             */}
        {/* ========================================================= */}
        {selectedMode === 'PRE_TRIP' && (
          <>
            {/* Countdown Badge & Summary */}
            <section className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex flex-col items-center justify-center font-bold shadow-md shadow-indigo-600/20">
                  <span className="text-2xl leading-none font-extrabold">{preTripContext.daysUntilTrip}</span>
                  <span className="text-[9px] uppercase tracking-wider text-indigo-100">Días</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Cuenta regresiva activa</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Salida: Lunes 12 de Octubre de 2026
                  </p>
                </div>
              </div>
              <Link
                to="/itinerario"
                className="shrink-0 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-2 rounded-xl flex items-center gap-1 transition-colors"
              >
                Itinerario <ChevronRight size={14} />
              </Link>
            </section>

            {/* Primer Vuelo Confirmado */}
            <section className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Plane size={18} />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">
                      Primer Vuelo del Viaje
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Copa Airlines · {preTripContext.firstFlight.bookingCode}
                    </h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full uppercase">
                  Confirmado
                </span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Ruta completa:</span>
                  <span className="font-bold text-slate-900">{preTripContext.firstFlight.route}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Salida Cali (CLO):</span>
                  <span className="font-bold text-indigo-600 font-mono">12 de Octubre · 12:06</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Llegada Boston (BOS):</span>
                  <span className="font-bold text-slate-900 font-mono">23:43 (Noche)</span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  to="/reservas"
                  className="flex-1 text-center py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Ver Código y Detalles
                </Link>
                <Link
                  to="/mapa"
                  className="flex-1 text-center py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  Ver Aeropuertos en Mapa
                </Link>
              </div>
            </section>

            {/* Alerta Crítica: Llegada Tardía a Boston */}
            <section className="bg-amber-50 rounded-3xl p-5 border border-amber-200/80 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                  <AlertTriangle size={18} />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block">
                    Alerta de Alojamiento Clave
                  </span>
                  <h3 className="text-sm font-extrabold text-amber-950 mb-1">
                    Llegada Nocturna a Cambridge (Airbnb Lynne)
                  </h3>
                  <p className="text-xs text-amber-900 font-medium leading-relaxed mb-3">
                    El vuelo aterriza en Boston a las 23:43. La llegada estimada a Cambridge es después de medianoche. Es imprescindible confirmar de antemano el protocolo de auto-check-in o recepción nocturna con la anfitriona Lynne.
                  </p>
                  <Link
                    to="/reservas"
                    className="inline-flex items-center gap-1.5 bg-amber-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-amber-700 transition-colors"
                  >
                    Ver Contacto y Alojamiento <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </section>

            {/* 6 Pendientes Críticos */}
            <section className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-rose-600" />
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    6 Pendientes Críticos del Viaje
                  </h2>
                </div>
                <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                  {tasks.filter(t => t.status === 'PENDING').length} por resolver
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Tareas indispensables registradas en la planificación canónica. Marca las que vayas completando:
              </p>

              <div className="space-y-2.5">
                {tasks.map((task) => {
                  const isDone = task.status === 'DONE';
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id, task.status)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isDone 
                          ? 'bg-slate-50 border-slate-200 text-slate-400' 
                          : 'bg-white border-rose-100 hover:border-rose-300 shadow-sm'
                      }`}
                    >
                      <button className="shrink-0 mt-0.5">
                        {isDone ? (
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        ) : (
                          <Circle size={18} className="text-rose-400 hover:text-rose-600" />
                        )}
                      </button>
                      <div className="flex-1">
                        <p className={`text-xs font-semibold leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </p>
                        <span className={`inline-block mt-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          isDone 
                            ? 'bg-slate-200 text-slate-600' 
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {isDone ? 'COMPLETADO' : 'CRÍTICO'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                <Link to="/tareas" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                  Ver gestión completa de tareas →
                </Link>
              </div>
            </section>

            {/* Acciones Inmediatas Recomendadas */}
            <section className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-slate-100">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                Acciones Previas Inmediatas
              </h2>
              <div className="space-y-2">
                {preTripContext.concreteActions.slice(0, 4).map((act) => (
                  <div key={act.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{act.title}</p>
                      <p className="text-[10px] text-slate-500">Plazo sugerido: {act.deadline}</p>
                    </div>
                    <Link
                      to={act.actionLink}
                      className="shrink-0 ml-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
                    >
                      Gestionar
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ========================================================= */}
        {/* MODO EN RUTA (SIMULACIÓN DE DÍA DURANTE EL VIAJE)          */}
        {/* ========================================================= */}
        {selectedMode === 'IN_TRIP' && (
          <>
            {/* Card: Próxima Actividad con Salida Recomendada */}
            {inTripContext.nextEvent ? (
              <section className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden">
                <div className="bg-indigo-600 text-white p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                      Próxima Parada
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-100">
                      Hora prog: {inTripContext.nextEvent.localTime || 'Hora libre'}
                    </span>
                  </div>

                  <h2 className="text-xl font-extrabold leading-tight text-white mb-1">
                    {(inTripContext.nextEvent as any).title || inTripContext.nextEvent.type}
                  </h2>

                  <div className="flex items-center gap-1.5 text-xs text-indigo-100 mt-2 font-medium">
                    <MapPin size={14} className="shrink-0 text-indigo-300" />
                    <span>{inTripContext.meetingPoint}</span>
                  </div>
                </div>

                {/* Algoritmo "Salir a las XX:XX" */}
                <div className="p-5 space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                          Hora de Salida Recomendada
                        </span>
                        <p className="text-2xl font-extrabold text-indigo-600 font-mono tracking-tight">
                          Salir a las {inTripContext.leaveByFormatted}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          inTripContext.status === 'SAFE' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : inTripContext.status === 'WATCH' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                        }`}>
                          Margen: {inTripContext.marginMin} min ({inTripContext.status})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 pt-2 border-t border-slate-200/60">
                      <span className="flex items-center gap-1">
                        <Footprints size={13} /> Caminata + Metro
                      </span>
                      <span className="text-slate-300">→</span>
                      <span className="text-indigo-600">~{inTripContext.transitEstimateMin} min tránsito</span>
                      <span className="text-slate-300">→</span>
                      <span className="text-emerald-600">Llegada puntual</span>
                    </div>
                  </div>

                  {/* Acciones Directas */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={`/tour/${inTripContext.nextEvent.id}`}
                      className="py-3 px-4 bg-indigo-600 text-white rounded-2xl text-xs font-extrabold text-center flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
                    >
                      <Play size={14} fill="currentColor" /> Iniciar Modo Tour
                    </Link>
                    <Link
                      to="/mapa"
                      className="py-3 px-4 bg-slate-900 text-white rounded-2xl text-xs font-extrabold text-center flex items-center justify-center gap-1.5 shadow-md hover:bg-black transition-colors"
                    >
                      <MapPin size={14} /> Ver en Mapa Online
                    </Link>
                  </div>
                </div>
              </section>
            ) : (
              <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
                <p className="text-slate-500 font-medium text-sm">
                  No hay más actividades programadas para este momento en esta fecha.
                </p>
                <Link
                  to="/explorar/nearby"
                  className="mt-3 inline-block bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Explorar Lugares Cercanos
                </Link>
              </section>
            )}

            {/* Tiempo Libre y Gastronomía Costo-Beneficio */}
            {inTripContext.freeTimeMinutes > 0 && (
              <section className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest block">
                      Disponibilidad Inteligente
                    </span>
                    <h3 className="text-base font-extrabold text-emerald-950">
                      Tienes ~{inTripContext.freeTimeMinutes} min de tiempo libre
                    </h3>
                  </div>
                  <Link
                    to="/explorar/nearby"
                    className="text-xs font-bold text-emerald-700 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-white transition-colors"
                  >
                    Ver Todos
                  </Link>
                </div>
                <p className="text-xs text-emerald-900 mb-3 font-medium">
                  Lugares recomendados con excelente relación costo-beneficio y rapidez de atención:
                </p>

                <div className="space-y-2">
                  {inTripContext.recommendedFood.map((food) => (
                    <div
                      key={food.id}
                      className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900">{food.name}</p>
                          <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            ★ {food.googleRating}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {food.specialty} · ~{food.speedMinutes} min
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-extrabold text-emerald-700 block">
                          {food.priceLevel}
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(food.name + ' ' + food.address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                        >
                          Mapa <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Alertas del Día */}
            {inTripContext.alerts.length > 0 && (
              <section className="bg-rose-50 rounded-3xl p-5 border border-rose-100 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertTriangle size={16} />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">
                    Alertas del Itinerario para Hoy
                  </h3>
                </div>
                {inTripContext.alerts.map((al) => (
                  <p key={al.id} className="text-xs text-rose-900 font-medium pl-6">
                    • {al.message}
                  </p>
                ))}
              </section>
            )}

            {/* Enlaces de Acción Rápida */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                to={`/itinerario/${simulatedDate}`}
                className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center font-bold text-xs text-slate-800 hover:bg-slate-50 transition-colors"
              >
                Ver Cronograma Completo del Día →
              </Link>
              <Link
                to="/reservas"
                className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center font-bold text-xs text-slate-800 hover:bg-slate-50 transition-colors"
              >
                Ver Tickets y Reservas →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
