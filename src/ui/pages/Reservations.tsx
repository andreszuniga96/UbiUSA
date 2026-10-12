import { useState } from 'react';
import { 
  useFlights, 
  useAccommodations, 
  useTransport, 
  useActivities, 
  useDocuments 
} from '../../hooks/useTripData';
import { 
  Ticket, 
  Plane, 
  Building, 
  Bus, 
  Copy, 
  Check, 
  MapPin, 
  FileText
} from 'lucide-react';

export default function Reservations() {
  const flights = useFlights();
  const accommodations = useAccommodations();
  const transport = useTransport();
  const activities = useActivities();
  const documents = useDocuments();

  const [activeTab, setActiveTab] = useState<'ALL' | 'FLIGHTS' | 'ACCOMMODATIONS' | 'TRANSPORT' | 'ACTIVITIES'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const activitiesWithBooking = activities.filter(
    a => (a.bookingCodes && a.bookingCodes.length > 0) || a.status === 'confirmado' || a.status === 'pendiente_compra'
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <header className="bg-slate-900 text-white pt-6 pb-6 px-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ticket size={24} className="text-indigo-400" />
            <h1 className="text-xl font-extrabold tracking-tight">Mis Reservas y Documentos</h1>
          </div>
          <span className="text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full">
            Oficiales · Iván & Gloria
          </span>
        </div>

        {/* Tab Filters */}
        <div className="max-w-2xl mx-auto flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Todos ({flights.length + accommodations.length + transport.length + activitiesWithBooking.length})
          </button>
          <button
            onClick={() => setActiveTab('FLIGHTS')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'FLIGHTS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Vuelos ({flights.length})
          </button>
          <button
            onClick={() => setActiveTab('ACCOMMODATIONS')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'ACCOMMODATIONS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Alojamientos ({accommodations.length})
          </button>
          <button
            onClick={() => setActiveTab('TRANSPORT')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'TRANSPORT'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Transporte ({transport.length})
          </button>
          <button
            onClick={() => setActiveTab('ACTIVITIES')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'ACTIVITIES'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Tours y Entradas ({activitiesWithBooking.length})
          </button>
        </div>
      </header>

      {/* Main List */}
      <main className="max-w-2xl mx-auto p-4 space-y-4 mt-2">

        {/* 1. SECCIÓN VUELOS */}
        {(activeTab === 'ALL' || activeTab === 'FLIGHTS') && (
          <section className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1">
              Vuelos Registrados
            </h2>
            {flights.map((f) => (
              <div key={f.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Plane size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{f.airline}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Fecha: {f.date}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase ${
                    f.status === 'confirmado' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {f.status === 'confirmado' ? 'Confirmado' : 'Pendiente Compra'}
                  </span>
                </div>

                {/* Segments */}
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

                {/* Booking code block */}
                {f.bookingCodes && f.bookingCodes.length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Código PNR / Reserva</p>
                      <p className="font-mono font-extrabold text-indigo-900 text-base">{f.bookingCodes[0]}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(f.bookingCodes![0])}
                      className="px-3 py-1.5 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                    >
                      {copiedCode === f.bookingCodes[0] ? (
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
                )}

                {f.notes && (
                  <p className="text-xs text-slate-500 font-medium pl-1">
                    Nota: {f.notes}
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* 2. SECCIÓN ALOJAMIENTOS */}
        {(activeTab === 'ALL' || activeTab === 'ACCOMMODATIONS') && (
          <section className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1">
              Alojamientos
            </h2>
            {accommodations.map((a) => (
              <div key={a.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Building size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{a.city}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Check-in: {a.checkIn} · Check-out: {a.checkOut}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase ${
                    a.status === 'confirmado' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {a.status === 'confirmado' ? 'Confirmado' : 'Pendiente Reserva'}
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

                {a.bookingCodes && a.bookingCodes.length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Código de Alojamiento</p>
                      <p className="font-mono font-extrabold text-indigo-900 text-base">{a.bookingCodes[0]}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(a.bookingCodes![0])}
                      className="px-3 py-1.5 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                    >
                      {copiedCode === a.bookingCodes[0] ? (
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
                )}
              </div>
            ))}
          </section>
        )}

        {/* 3. SECCIÓN TRANSPORTE TERRESTRE */}
        {(activeTab === 'ALL' || activeTab === 'TRANSPORT') && (
          <section className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1">
              Transporte Terrestre Interurbano
            </h2>
            {transport.map((t) => (
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
                  <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase bg-amber-100 text-amber-800">
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
                  <div className="mt-2 text-[11px] text-slate-600">
                    {t.notes}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* 4. SECCIÓN ACTIVIDADES Y ENTRADAS */}
        {(activeTab === 'ALL' || activeTab === 'ACTIVITIES') && (
          <section className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1">
              Entradas y Tours Verificados
            </h2>
            {activitiesWithBooking.map((act) => (
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
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase ${
                    act.status === 'confirmado' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {act.status}
                  </span>
                </div>

                {act.meetingPoint && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 pl-1">
                    <MapPin size={13} className="text-indigo-500 shrink-0" />
                    Punto de encuentro: <strong>{act.meetingPoint}</strong>
                  </p>
                )}

                {act.bookingCodes && act.bookingCodes.length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Código de Entrada / Boleto</p>
                      <p className="font-mono font-extrabold text-indigo-900 text-base">{act.bookingCodes.join(', ')}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(act.bookingCodes![0])}
                      className="px-3 py-1.5 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                    >
                      {copiedCode === act.bookingCodes[0] ? (
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
                )}
              </div>
            ))}
          </section>
        )}

        {/* 5. SECCIÓN DOCUMENTOS DISPONIBLES OFFLINE */}
        {documents.length > 0 && (
          <section className="bg-slate-100/80 rounded-3xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-slate-700" />
              <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">
                Documentos Listos para Consulta Offline ({documents.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{doc.title}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">● Disponible localmente</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {doc.category}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
