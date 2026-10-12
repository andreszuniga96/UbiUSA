import { useState, useMemo } from 'react';
import { 
  useFlights, 
  useAccommodations, 
  useTransport, 
  useActivities, 
  useDocuments,
  useDays 
} from '../../hooks/useTripData';
import { 
  Ticket, 
  Plane, 
  Building, 
  Bus, 
  Copy, 
  Check, 
  MapPin, 
  FileText,
  Eye,
  EyeOff,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';

export default function Reservations() {
  const flights = useFlights();
  const accommodations = useAccommodations();
  const transport = useTransport();
  const activities = useActivities();
  const documents = useDocuments();
  const days = useDays();

  // Filters state
  const [activeTab, setActiveTab] = useState<'ALL' | 'FLIGHTS' | 'ACCOMMODATIONS' | 'TRANSPORT' | 'ACTIVITIES'>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'CONFIRMED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({});

  const toggleShowCode = (id: string) => {
    setShowCodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2500);
  };

  // Helper matching city
  const matchesCity = (itemCity?: string) => {
    if (selectedCity === 'ALL') return true;
    if (!itemCity) return false;
    const c = itemCity.toLowerCase();
    const sel = selectedCity.toLowerCase();
    return c.includes(sel) || sel.includes(c);
  };

  // Helper matching status
  const matchesStatus = (status: string) => {
    if (selectedStatus === 'ALL') return true;
    const isConf = status === 'confirmado' || status === 'realizado';
    if (selectedStatus === 'CONFIRMED') return isConf;
    return !isConf;
  };

  // Helper matching search
  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  // Filtered lists
  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      const cityMatch = selectedCity === 'ALL' || f.segments?.some(s => matchesCity(s.origin) || matchesCity(s.destination));
      const dateMatch = selectedDate === 'ALL' || f.date === selectedDate;
      const statusMatch = matchesStatus(f.status);
      const textToSearch = `${f.airline} ${f.bookingCodes?.join(' ')} ${f.segments?.map(s => `${s.origin} ${s.destination} ${s.flightNumber}`).join(' ')} ${f.notes || ''}`;
      return cityMatch && dateMatch && statusMatch && matchesSearch(textToSearch);
    });
  }, [flights, selectedCity, selectedDate, selectedStatus, searchQuery]);

  const filteredAccommodations = useMemo(() => {
    return accommodations.filter(a => {
      const cityMatch = matchesCity(a.city);
      const dateMatch = selectedDate === 'ALL' || (selectedDate >= a.checkIn.slice(0, 10) && selectedDate <= a.checkOut.slice(0, 10));
      const statusMatch = matchesStatus(a.status);
      const textToSearch = `${a.city} ${a.platform} ${a.host || ''} ${a.bookingCodes?.join(' ')} ${a.notes || ''}`;
      return cityMatch && dateMatch && statusMatch && matchesSearch(textToSearch);
    });
  }, [accommodations, selectedCity, selectedDate, selectedStatus, searchQuery]);

  const filteredTransport = useMemo(() => {
    return transport.filter(t => {
      const cityMatch = selectedCity === 'ALL' || matchesCity(t.origin) || matchesCity(t.destination);
      const dateMatch = selectedDate === 'ALL' || t.date === selectedDate;
      const statusMatch = matchesStatus(t.status);
      const textToSearch = `${t.origin} ${t.destination} ${t.transportType} ${t.notes || ''}`;
      return cityMatch && dateMatch && statusMatch && matchesSearch(textToSearch);
    });
  }, [transport, selectedCity, selectedDate, selectedStatus, searchQuery]);

  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const cityMatch = selectedCity === 'ALL' || matchesCity(act.city);
      const dateMatch = selectedDate === 'ALL' || act.date === selectedDate;
      const statusMatch = matchesStatus(act.status);
      const textToSearch = `${act.title} ${act.provider || ''} ${act.meetingPoint || ''} ${act.bookingCodes?.join(' ')} ${act.notes || ''}`;
      return cityMatch && dateMatch && statusMatch && matchesSearch(textToSearch);
    });
  }, [activities, selectedCity, selectedDate, selectedStatus, searchQuery]);

  const totalCount = filteredFlights.length + filteredAccommodations.length + filteredTransport.length + filteredActivities.length;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header Sticky */}
      <header className="bg-slate-900 text-white pt-5 pb-5 px-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Ticket size={22} className="text-indigo-400" />
            <h1 className="text-xl font-extrabold tracking-tight">Centro de Reservas</h1>
          </div>
          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Iván & Gloria · Datos Offline
          </span>
        </div>

        {/* Search Input */}
        <div className="max-w-2xl mx-auto mb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por aerolínea, anfitrión, código o lugar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Categories Tab */}
        <div className="max-w-2xl mx-auto flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold mb-3">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('FLIGHTS')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'FLIGHTS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Vuelos ({filteredFlights.length})
          </button>
          <button
            onClick={() => setActiveTab('ACCOMMODATIONS')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'ACCOMMODATIONS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Alojamientos ({filteredAccommodations.length})
          </button>
          <button
            onClick={() => setActiveTab('TRANSPORT')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'TRANSPORT'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Transporte ({filteredTransport.length})
          </button>
          <button
            onClick={() => setActiveTab('ACTIVITIES')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'ACTIVITIES'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Tours y Entradas ({filteredActivities.length})
          </button>
        </div>

        {/* Sub-Filters: Ciudad, Fecha, Estado */}
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-2 text-[11px] font-semibold">
          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="ALL">Todas las ciudades</option>
              <option value="Boston">Boston / Cambridge</option>
              <option value="Bayonne">Nueva York / Bayonne</option>
              <option value="Orlando">Orlando, FL</option>
              <option value="Washington">Washington D.C.</option>
              <option value="Niágara">Niágara</option>
            </select>
          </div>

          <div>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="ALL">Cualquier fecha</option>
              {days.map(d => (
                <option key={d.date} value={d.date}>
                  {d.date.slice(5)} ({d.city.slice(0, 10)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="ALL">Cualquier estado</option>
              <option value="CONFIRMED">Solo Confirmados</option>
              <option value="PENDING">Pendientes de compra</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main List */}
      <main className="max-w-2xl mx-auto p-4 space-y-4 mt-1">

        {/* Resumen rápido de registros */}
        <div className="flex justify-between items-center text-xs text-slate-500 font-medium px-1">
          <span>{totalCount} registro(s) encontrado(s)</span>
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 size={13} /> Disponibles sin conexión
          </span>
        </div>

        {/* 1. SECCIÓN VUELOS */}
        {(activeTab === 'ALL' || activeTab === 'FLIGHTS') && filteredFlights.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1">
              Vuelos Registrados ({filteredFlights.length})
            </h2>
            {filteredFlights.map((f) => {
              const code = f.bookingCodes?.[0];
              const isMasked = code && !showCodes[f.id];
              const isConfirmed = f.status === 'confirmado';

              return (
                <div key={f.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Plane size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{f.airline}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Fecha: {f.date} {f.localTime ? `· Salida: ${f.localTime}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase flex items-center gap-1 ${
                      isConfirmed 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isConfirmed ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                      {isConfirmed ? 'Confirmado' : 'Pendiente Compra'}
                    </span>
                  </div>

                  {/* Trayectos / Segmentos */}
                  {f.segments && f.segments.length > 0 && (
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                      {f.segments.map((seg, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">
                            {seg.origin} → {seg.destination}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {seg.flightNumber ? `Vuelo ${seg.flightNumber} · ` : ''}{seg.departureTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PNR / Código de reserva con privacidad */}
                  {code && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                          Código PNR / Reserva (Privado)
                        </p>
                        <p className="font-mono font-extrabold text-indigo-900 text-base tracking-wide">
                          {isMasked ? '••••••••' : f.bookingCodes.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleShowCode(f.id)}
                          title={isMasked ? 'Mostrar código' : 'Ocultar código'}
                          className="p-2 bg-white text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                        >
                          {isMasked ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button
                          onClick={() => handleCopyCode(code)}
                          className="px-3 py-1.5 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                        >
                          {copiedCode === code ? (
                            <>
                              <Check size={14} className="text-emerald-600" /> Copiado
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Copiar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {f.notes && (
                    <p className="text-xs text-slate-500 font-medium pl-1 bg-slate-50 p-2 rounded-xl">
                      ℹ️ {f.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* 2. SECCIÓN ALOJAMIENTOS */}
        {(activeTab === 'ALL' || activeTab === 'ACCOMMODATIONS') && filteredAccommodations.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1">
              Alojamientos ({filteredAccommodations.length})
            </h2>
            {filteredAccommodations.map((a) => {
              const code = a.bookingCodes?.[0];
              const isMasked = code && !showCodes[a.id];
              const isConfirmed = a.status === 'confirmado';
              const fullAddress = a.city === 'Cambridge, MA'
                ? 'Cambridge, MA (Cerca de Harvard/MIT)'
                : a.city === 'Bayonne, NJ'
                  ? 'Bayonne, NJ (Acceso tren PATH a WTC)'
                  : a.city;

              return (
                <div key={a.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Building size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{a.city}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Check-in: {a.checkIn?.slice(0, 10)} · Check-out: {a.checkOut?.slice(0, 10)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase flex items-center gap-1 ${
                      isConfirmed 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isConfirmed ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                      {isConfirmed ? 'Confirmado' : 'Pendiente Reserva'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                    {a.host && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Anfitrión:</span>
                        <span className="font-bold text-slate-800">{a.host}</span>
                      </div>
                    )}
                    {a.platform && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Plataforma:</span>
                        <span className="font-bold text-slate-800">{a.platform}</span>
                      </div>
                    )}
                    {a.notes && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-medium text-[11px]">
                        ⚠️ {a.notes}
                      </div>
                    )}
                  </div>

                  {/* Dirección con botones para copiar y abrir mapa */}
                  <div className="flex items-center justify-between bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs">
                    <span className="text-slate-600 flex items-center gap-1.5 font-medium truncate mr-2">
                      <MapPin size={14} className="text-rose-500 shrink-0" />
                      {fullAddress}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyAddress(fullAddress)}
                        className="p-1.5 bg-white text-slate-700 hover:text-indigo-600 rounded-lg border border-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title="Copiar dirección"
                      >
                        {copiedAddress === fullAddress ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title="Abrir en Google Maps"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  {/* Código de reserva */}
                  {code && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Código de Alojamiento</p>
                        <p className="font-mono font-extrabold text-indigo-900 text-base">
                          {isMasked ? '••••••••' : a.bookingCodes!.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleShowCode(a.id)}
                          title={isMasked ? 'Mostrar código' : 'Ocultar código'}
                          className="p-2 bg-white text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                        >
                          {isMasked ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button
                          onClick={() => handleCopyCode(code)}
                          className="px-3 py-1.5 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                        >
                          {copiedCode === code ? (
                            <>
                              <Check size={14} className="text-emerald-600" /> Copiado
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Copiar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* 3. SECCIÓN TRANSPORTE TERRESTRE */}
        {(activeTab === 'ALL' || activeTab === 'TRANSPORT') && filteredTransport.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1">
              Transporte Terrestre Interurbano ({filteredTransport.length})
            </h2>
            {filteredTransport.map((t) => (
              <div key={t.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                      <Bus size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {t.origin} → {t.destination}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Fecha: Noche del 15 de Octubre (Llegada 16 de Octubre)
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Clock size={11} />
                    {t.status === 'pendiente_compra' ? 'Comprar Tickets' : t.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Salida estimada:</span>
                    <span className="font-bold text-slate-800">{t.departureTime} (Boston South Station)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Llegada estimada:</span>
                    <span className="font-bold text-slate-800">{t.arrivalTime} (NY Port Authority)</span>
                  </div>
                  {t.notes && (
                    <div className="mt-2 text-[11px] text-slate-600">
                      ℹ️ {t.notes}
                    </div>
                  )}
                </div>

                {/* Acciones para estaciones */}
                <div className="flex gap-2 text-xs">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Boston+South+Station"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center flex items-center justify-center gap-1"
                  >
                    Estación Origen <ExternalLink size={12} />
                  </a>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Port+Authority+Bus+Terminal+New+York"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center flex items-center justify-center gap-1"
                  >
                    Estación Destino <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* 4. SECCIÓN ACTIVIDADES Y ENTRADAS */}
        {(activeTab === 'ALL' || activeTab === 'ACTIVITIES') && filteredActivities.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1">
              Entradas y Tours Verificados ({filteredActivities.length})
            </h2>
            {filteredActivities.map((act) => {
              const code = act.bookingCodes?.[0];
              const isMasked = code && !showCodes[act.id];
              const isConfirmed = act.status === 'confirmado';

              return (
                <div key={act.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Ticket size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">{act.title}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Fecha: {act.date} {act.localTime && `· Hora: ${act.localTime}`}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase flex items-center gap-1 ${
                      isConfirmed 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isConfirmed ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                      {act.status}
                    </span>
                  </div>

                  {act.provider && (
                    <p className="text-xs text-slate-500 font-medium pl-1">
                      Proveedor: <strong className="text-slate-800">{act.provider}</strong>
                    </p>
                  )}

                  {act.meetingPoint && (
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <span className="text-slate-600 flex items-center gap-1.5 font-medium truncate mr-2">
                        <MapPin size={14} className="text-indigo-500 shrink-0" />
                        Punto de encuentro: <strong className="text-slate-800">{act.meetingPoint}</strong>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopyAddress(act.meetingPoint!)}
                          className="p-1.5 bg-white text-slate-700 hover:text-indigo-600 rounded-lg border border-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="Copiar dirección"
                        >
                          {copiedAddress === act.meetingPoint ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.meetingPoint + ' ' + (act.city || ''))}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="Abrir en Google Maps"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Código de entrada / boleto */}
                  {code && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Código de Entrada / Boleto</p>
                        <p className="font-mono font-extrabold text-indigo-900 text-base">
                          {isMasked ? '••••••••' : act.bookingCodes!.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleShowCode(act.id)}
                          title={isMasked ? 'Mostrar código' : 'Ocultar código'}
                          className="p-2 bg-white text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                        >
                          {isMasked ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button
                          onClick={() => handleCopyCode(code)}
                          className="px-3 py-1.5 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                        >
                          {copiedCode === code ? (
                            <>
                              <Check size={14} className="text-emerald-600" /> Copiado
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Copiar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* 5. SECCIÓN DOCUMENTOS DISPONIBLES OFFLINE */}
        {documents.length > 0 && (
          <section className="bg-slate-100/80 rounded-3xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-slate-700" />
                <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">
                  Documentos y Confirmaciones Offline ({documents.length})
                </h2>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Almacenados en IndexedDB
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{doc.title}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">● Disponible sin conexión</p>
                    {doc.notes && <p className="text-[10px] text-slate-500 font-mono mt-0.5">{doc.notes}</p>}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {doc.category}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {totalCount === 0 && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
            <Ticket size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No se encontraron reservas con los filtros seleccionados.</p>
            <p className="text-xs text-slate-400">Prueba cambiando la ciudad, la fecha o el término de búsqueda.</p>
            <button
              onClick={() => {
                setActiveTab('ALL');
                setSelectedCity('ALL');
                setSelectedDate('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs hover:bg-indigo-100 transition-colors"
            >
              Restablecer Filtros
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
