import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  useCriticalTasks, 
  useTimelineEvents, 
  useTravelAlerts, 
  useDays,
  useDismissedAlertIds,
  useSyncStats
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
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Play,
  Copy,
  Check,
  Eye,
  EyeOff,
  Bell,
  Clock,
  Ticket,
  Moon,
  X,
  Compass
} from 'lucide-react';
import { TravelContextEngine } from '../../services/TravelContextEngine';
import { NotificationService, NotificationPermissionState } from '../../services/NotificationService';

export default function Dashboard() {
  const tasks = useCriticalTasks();
  const events = useTimelineEvents();
  const rawAlerts = useTravelAlerts();
  const days = useDays();
  const dismissedAlertIds = useDismissedAlertIds();
  const syncStats = useSyncStats();
  const { isOnline } = useTripStore();

  // Mode: Pre-Trip vs Copiloto en Ruta
  const [selectedMode, setSelectedMode] = useState<'PRE_TRIP' | 'IN_TRIP'>('IN_TRIP');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-13');
  const [simulatedHour, setSimulatedHour] = useState<string>('09:15');

  // UI state for clipboard & code privacy
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>({});

  // Browser notification permission state
  const [notificationPerm, setNotificationPerm] = useState<NotificationPermissionState>(
    NotificationService.getPermissionState()
  );

  const requestNotificationPermission = async () => {
    const res = await NotificationService.requestPermission();
    setNotificationPerm(res);
    if (res === 'granted') {
      NotificationService.notify('UbiUSA · Copiloto de Viaje', {
        body: 'Alertas contextuales y recordatorios de salida habilitados.',
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2500);
  };

  const toggleCodeVisibility = (code: string) => {
    setRevealedCodes(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const dismissAlert = async (alertId: string) => {
    await TripRepository.dismissAlert(alertId);
  };

  const restoreAllAlerts = async () => {
    for (const id of dismissedAlertIds) {
      await TripRepository.restoreAlert(id);
    }
  };

  // Real or simulated now timestamp
  const realNow = Date.now();
  const tripStartDate = new Date('2026-10-12T00:00:00');

  // Check if today falls in the trip
  const realTodayISO = new Date().toISOString().slice(0, 10);
  const isRealTodayInTrip = realTodayISO >= '2026-10-12' && realTodayISO <= '2026-10-29';

  // Compute contexts
  const preTripContext = useMemo(() => {
    return TravelContextEngine.evaluatePreTrip(realNow, rawAlerts, tasks);
  }, [realNow, rawAlerts, tasks]);

  const simulatedTimeMs = useMemo(() => {
    return new Date(`${selectedDate}T${simulatedHour}:00`).getTime();
  }, [selectedDate, simulatedHour]);

  const inTripContext = useMemo(() => {
    return TravelContextEngine.evaluateInTrip(
      selectedDate,
      simulatedTimeMs,
      events,
      rawAlerts,
      dismissedAlertIds
    );
  }, [selectedDate, simulatedTimeMs, events, rawAlerts, dismissedAlertIds]);

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

  const setDateToToday = () => {
    if (isRealTodayInTrip) {
      setSelectedDate(realTodayISO);
    } else {
      setSelectedDate('2026-10-12');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Top Header & Context Operational Center */}
      <header className="bg-slate-900 text-white pt-5 pb-8 px-4 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-20 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Top Status Bar: Branding, Offline/Online & Sync Status */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                UbiUSA · Copiloto de Viaje V8
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border shadow-sm ${
                isOnline 
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                {isOnline ? '● ONLINE' : '○ OFFLINE'}
                {syncStats.pendingCount > 0 && (
                  <span className="text-[10px] text-amber-300 font-extrabold bg-amber-900/60 px-1.5 py-0.2 rounded">
                    ({syncStats.pendingCount} pendientes)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl flex gap-1 mb-5 border border-slate-700/60">
            <button
              onClick={() => setSelectedMode('IN_TRIP')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                selectedMode === 'IN_TRIP'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Navigation size={14} />
              Copiloto del Día (Operativo)
            </button>
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
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-md border border-indigo-500/30">
                      Día {getDayNumber(selectedDate)} de 18
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {inTripContext.city}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white capitalize">
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('es-ES', { 
                      weekday: 'long', day: 'numeric', month: 'long' 
                    })}
                  </h1>
                  <p className="text-slate-400 text-[11px] font-semibold mt-0.5 flex items-center gap-1.5">
                    <Clock size={12} className="text-amber-400" />
                    Zona horaria: <span className="text-amber-300 font-bold">{inTripContext.timeZoneAbbr}</span> ({inTripContext.timeZone})
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Hora operativa:</span>
                  <span className="text-xl font-mono font-extrabold text-amber-300">{simulatedHour}</span>
                </div>
              </div>

              {/* Selector Rápido de Día y Hora */}
              <div className="mt-3 grid grid-cols-12 gap-2 bg-slate-800/90 p-2.5 rounded-2xl border border-slate-700">
                <div className="col-span-7">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">
                      Día del Itinerario
                    </label>
                    <button
                      onClick={setDateToToday}
                      className="text-[9px] font-extrabold text-indigo-400 hover:text-indigo-300 uppercase px-1.5 py-0.5 bg-indigo-950/80 rounded border border-indigo-800"
                    >
                      Ir a Hoy
                    </button>
                  </div>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {days.map((d) => (
                      <option key={d.date} value={d.date}>
                        Día {getDayNumber(d.date)} ({d.date.slice(5)}): {d.city.split('/')[0].slice(0, 16)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
                    Hora del Día
                  </label>
                  <select
                    value={simulatedHour}
                    onChange={(e) => setSimulatedHour(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="08:30">08:30 (Mañana)</option>
                    <option value="09:15">09:15 (Salida a Tour)</option>
                    <option value="11:45">11:45 (Almuerzo)</option>
                    <option value="13:30">13:30 (Tarde Temprana)</option>
                    <option value="16:45">16:45 (Atardecer)</option>
                    <option value="19:30">19:30 (Noche / Cena)</option>
                    <option value="23:30">23:30 (Nocturno)</option>
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
        {/* BANNER DE NOTIFICACIONES BROWSER SI ESTÁN DESACTIVADAS    */}
        {/* ========================================================= */}
        {notificationPerm !== 'granted' && (
          <section className="bg-slate-900 text-white rounded-3xl p-4 shadow-lg border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300">
                <Bell size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Alertas de salida en pantalla</p>
                <p className="text-[11px] text-slate-400">
                  {notificationPerm === 'denied' 
                    ? 'Notificaciones bloqueadas en navegador. Las alertas se muestran aquí.'
                    : 'Activa recordatorios para no perder la hora recomendada de salida.'}
                </p>
              </div>
            </div>
            {notificationPerm === 'default' && (
              <button
                onClick={requestNotificationPermission}
                className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Activar
              </button>
            )}
          </section>
        )}

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
              <button
                onClick={() => { setSelectedMode('IN_TRIP'); setSelectedDate('2026-10-12'); }}
                className="shrink-0 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-2 rounded-xl flex items-center gap-1 transition-colors"
              >
                Ver Día 1 <ChevronRight size={14} />
              </button>
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
                  <span className="font-bold text-indigo-600 font-mono">12 de Octubre · 12:06 (COT)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Llegada Boston (BOS):</span>
                  <span className="font-bold text-slate-900 font-mono">23:43 (EDT - Noche)</span>
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
            </section>
          </>
        )}

        {/* ========================================================= */}
        {/* MODO EN RUTA: COPILOTO DEL DÍA (OPERATIVO)                */}
        {/* ========================================================= */}
        {selectedMode === 'IN_TRIP' && (
          <>
            {/* BANNER DE TRANSICIÓN NOCTURNA SI APLICA */}
            {inTripContext.isNocturnalTransition && inTripContext.nocturnalNote && (
              <section className="bg-purple-950 text-purple-100 rounded-3xl p-4.5 border border-purple-800 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-800 text-purple-200 shrink-0 mt-0.5">
                    <Moon size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 block">
                      Aviso de Desplazamiento Nocturno
                    </span>
                    <h3 className="text-xs font-bold text-white mb-1">
                      {inTripContext.nocturnalNote}
                    </h3>
                    <p className="text-[11px] text-purple-200/90 leading-relaxed">
                      Ten a mano los códigos de reserva y confirma el acceso antes de viajar.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* HERO CARD: PRÓXIMA ACTIVIDAD Y CENTRO OPERATIVO */}
            {inTripContext.nextEvent ? (
              <section className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden">
                {/* Header de la tarjeta */}
                <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-700 text-white p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                      <Compass size={12} />
                      Próxima Actividad
                    </span>
                    <span className="text-xs font-mono font-extrabold text-amber-300 bg-black/20 px-2.5 py-1 rounded-lg">
                      {inTripContext.nextEvent.localTime ? `Hora: ${inTripContext.nextEvent.localTime} (${inTripContext.timeZoneAbbr})` : 'Horario flexible'}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold leading-tight text-white mb-2">
                    {(inTripContext.nextEvent as any).title || inTripContext.nextEvent.type}
                  </h2>

                  {/* Punto de encuentro y dirección */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 space-y-2 mt-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 text-xs text-white">
                        <MapPin size={16} className="text-amber-300 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold leading-snug">{inTripContext.meetingPoint}</p>
                          {inTripContext.meetingPointAddress && inTripContext.meetingPointAddress !== inTripContext.meetingPoint && (
                            <p className="text-[11px] text-indigo-100/90 font-normal mt-0.5">
                              {inTripContext.meetingPointAddress}
                            </p>
                          )}
                        </div>
                      </div>

                      {inTripContext.meetingPointAddress && (
                        <button
                          onClick={() => handleCopyAddress(inTripContext.meetingPointAddress!)}
                          className="shrink-0 p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                          title="Copiar dirección"
                        >
                          {copiedAddress ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Algoritmo "Salir a las XX:XX" y Navegación */}
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
                        <Footprints size={13} /> Metro / Caminata
                      </span>
                      <span className="text-slate-300">→</span>
                      <span className="text-indigo-600">~{inTripContext.transitEstimateMin} min traslado</span>
                      <span className="text-slate-300">→</span>
                      <span className="text-emerald-600">Llegada puntual</span>
                    </div>
                  </div>

                  {/* Reservas y Documentos necesarios para esta parada */}
                  {inTripContext.requiredBookings.length > 0 && (
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Ticket size={13} />
                          Documentos / Código para esta parada
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          inTripContext.nextEvent.status === 'confirmado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {inTripContext.nextEvent.status}
                        </span>
                      </div>

                      {inTripContext.requiredBookings.map((bk, idx) => {
                        const isMasked = bk.code && !bk.code.includes('Sin código') && !revealedCodes[bk.code];
                        return (
                          <div key={idx} className="bg-white p-2.5 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                            <div>
                              <p className="text-[10px] text-slate-500 font-semibold">{bk.label}</p>
                              <p className="font-mono font-extrabold text-slate-900">
                                {isMasked ? '••••••••' : bk.code}
                              </p>
                            </div>
                            {bk.code && !bk.code.includes('Sin código') && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleCodeVisibility(bk.code)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs"
                                  title={isMasked ? 'Mostrar código' : 'Ocultar código'}
                                >
                                  {isMasked ? <Eye size={13} /> : <EyeOff size={13} />}
                                </button>
                                <button
                                  onClick={() => handleCopyCode(bk.code)}
                                  className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-bold text-[11px] flex items-center gap-1"
                                >
                                  {copiedCode === bk.code ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                  Copiar
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Botones de Acción Inmediata (Navegación & Modo Tour) */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={inTripContext.navigationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold text-center flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-98"
                    >
                      <Navigation size={15} />
                      Navegar en Mapa
                    </a>

                    <Link
                      to={`/tour/${inTripContext.nextEvent.id}`}
                      className="py-3.5 px-4 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-extrabold text-center flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                    >
                      <Play size={14} fill="currentColor" />
                      Modo Tour / Pasos
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

            {/* ALERTAS CONTEXTUALES DEL DÍA (P1) */}
            {inTripContext.alerts.length > 0 && (
              <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Alertas Contextuales del Día ({inTripContext.alerts.length})
                    </h3>
                  </div>
                  {dismissedAlertIds.length > 0 && (
                    <button
                      onClick={restoreAllAlerts}
                      className="text-[10px] text-indigo-600 font-bold hover:underline"
                    >
                      Restaurar alertas ({dismissedAlertIds.length})
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {inTripContext.alerts.map((al) => {
                    const isCritical = al.level === 'CRITICAL' || al.type === 'CRITICAL';
                    const isWatch = al.level === 'WATCH' || al.type === 'WATCH';
                    const isInfo = al.level === 'INFO' || (!isCritical && !isWatch);

                    return (
                      <div
                        key={al.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isCritical
                            ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                            : isWatch
                              ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                              isCritical
                                ? 'bg-rose-200 text-rose-900'
                                : isWatch
                                  ? 'bg-amber-200 text-amber-900'
                                  : 'bg-slate-200 text-slate-800'
                            }`}>
                              {isCritical ? 'CRÍTICA' : isWatch ? 'ADVERTENCIA' : 'INFORMATIVA'}
                            </span>
                            {al.timeAvailableMin !== undefined && al.timeAvailableMin > 0 && (
                              <span className="text-[10px] font-mono font-bold text-slate-500">
                                Restan ~{al.timeAvailableMin} min
                              </span>
                            )}
                          </div>

                          {/* Botón para descartar alertas informativas */}
                          {isInfo && (
                            <button
                              onClick={() => dismissAlert(al.id)}
                              className="text-slate-400 hover:text-slate-700 p-1"
                              title="Descartar alerta informativa"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        <p className="text-xs font-bold leading-snug mb-1">{al.message}</p>

                        {al.cause && (
                          <p className="text-[11px] opacity-90 leading-relaxed mb-1">
                            <strong className="font-semibold">Causa:</strong> {al.cause}
                          </p>
                        )}

                        {al.recommendedAction && (
                          <p className="text-[11px] font-semibold mt-1.5 pt-1.5 border-t border-current/15 flex items-start gap-1">
                            <span className="text-indigo-600">→</span>
                            <span>{al.recommendedAction}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* CRONOGRAMA COMPLETO DEL DÍA SELECCIONADO */}
            {inTripContext.allDayEvents.length > 0 && (
              <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                    Cronograma de Hoy ({inTripContext.allDayEvents.length} eventos)
                  </h3>
                  <Link
                    to={`/itinerario/${selectedDate}`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                  >
                    Detalle <ChevronRight size={13} />
                  </Link>
                </div>

                <div className="space-y-2">
                  {inTripContext.allDayEvents.map((ev) => {
                    const isCurrent = inTripContext.currentEvent?.id === ev.id;
                    const isNext = inTripContext.nextEvent?.id === ev.id;

                    return (
                      <div
                        key={ev.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
                          isNext
                            ? 'bg-indigo-50/70 border-indigo-200'
                            : isCurrent
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-extrabold text-indigo-600 shrink-0">
                            {ev.localTime || 'Hora libre'}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 leading-snug">
                              {(ev as any).title || ev.type}
                            </p>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {(ev as any).provider || ev.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isNext && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-indigo-600 text-white uppercase">
                              Siguiente
                            </span>
                          )}
                          <Link
                            to={`/tour/${ev.id}`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600"
                            title="Ver detalles"
                          >
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* TIEMPO LIBRE Y RECOMENDACIONES CERCANAS COSTO-BENEFICIO */}
            {inTripContext.freeTimeMinutes > 0 && inTripContext.recommendedFood.length > 0 && (
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
                    Explorar Más
                  </Link>
                </div>
                <p className="text-xs text-emerald-900 mb-3 font-medium">
                  Lugares con alta relación costo-beneficio y atención rápida cerca del itinerario:
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

            {/* Accesos Rápidos Operativos */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                to="/reservas"
                className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center font-bold text-xs text-slate-800 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Ticket size={15} className="text-indigo-600" />
                Mis Reservas y PNR →
              </Link>
              <Link
                to="/tareas"
                className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center font-bold text-xs text-slate-800 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldAlert size={15} className="text-rose-600" />
                Tareas Pendientes →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
