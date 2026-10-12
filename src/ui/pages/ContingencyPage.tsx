import { useState } from 'react';
import { 
  useAccommodations 
} from '../../hooks/useTripData';
import { 
  ShieldAlert, 
  Phone, 
  Copy, 
  Check, 
  ExternalLink, 
  Building, 
  Compass, 
  Ticket,
  ChevronDown,
  ChevronUp,
  Landmark
} from 'lucide-react';

export default function ContingencyPage() {
  const accommodations = useAccommodations();

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showOfficialEmergencies, setShowOfficialEmergencies] = useState(true);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-32">
      {/* Top Banner de Contingencia */}
      <header className="bg-rose-950/90 border-b border-rose-800/80 px-4 pt-6 pb-6 shadow-xl sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-rose-600 text-white rounded-xl shadow-md">
                <ShieldAlert size={22} />
              </span>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white">Modo Contingencia</h1>
                <p className="text-[11px] text-rose-200 font-medium">
                  Acceso ultrarrápido offline a contactos, alojamientos y emergencias
                </p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-rose-900 text-rose-300 border border-rose-700 px-2.5 py-1 rounded-full">
              100% Offline
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-5 mt-2">
        {/* ======================================================== */}
        {/* SECCIÓN 1: SERVICIOS OFICIALES DE EMERGENCIA EN EE.UU.     */}
        {/* ======================================================== */}
        <section className="bg-slate-800/90 rounded-3xl p-5 border border-slate-700 shadow-md space-y-3">
          <div 
            onClick={() => setShowOfficialEmergencies(!showOfficialEmergencies)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Landmark size={18} className="text-amber-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-amber-300">
                Líneas Oficiales de Emergencia (EE.UU.)
              </h2>
            </div>
            <button className="text-slate-400 hover:text-white">
              {showOfficialEmergencies ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          <p className="text-[11px] text-slate-300">
            Diferenciadas de servicios comerciales. Toda llamada debe ser iniciada manualmente por el usuario:
          </p>

          {showOfficialEmergencies && (
            <div className="space-y-2 pt-1">
              {/* 911 */}
              <div className="bg-rose-950/60 border border-rose-800/70 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-rose-400 font-mono">911</span>
                    <span className="text-xs font-bold text-white">Emergencias Nacionales</span>
                  </div>
                  <p className="text-[11px] text-rose-200/80 mt-0.5">Policía, Bomberos y Ambulancias en todo EE.UU.</p>
                </div>
                <a
                  href="tel:911"
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-md transition-all active:scale-95"
                >
                  <Phone size={13} /> Llamar
                </a>
              </div>

              {/* 311 */}
              <div className="bg-slate-900/80 border border-slate-700 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-indigo-400 font-mono">311</span>
                    <span className="text-xs font-bold text-white">Servicios Ciudadanos (NYC / Boston)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Asistencia municipal no urgente, objetos perdidos y transporte.</p>
                </div>
                <a
                  href="tel:311"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 border border-slate-600 transition-colors"
                >
                  <Phone size={12} /> Llamar
                </a>
              </div>

              {/* 988 */}
              <div className="bg-slate-900/80 border border-slate-700 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-teal-400 font-mono">988</span>
                    <span className="text-xs font-bold text-white">Línea de Crisis y Salud Mental</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Apoyo confidencial gratuito 24/7 en español e inglés.</p>
                </div>
                <a
                  href="tel:988"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 border border-slate-600 transition-colors"
                >
                  <Phone size={12} /> Llamar
                </a>
              </div>

              {/* Consulados de Colombia en el itinerario */}
              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700 space-y-2 mt-2">
                <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider block">
                  🇨🇴 Asistencia Consular para Colombianos (Iván & Gloria)
                </span>
                
                <div className="space-y-2 text-xs">
                  {/* Boston */}
                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <div>
                      <p className="font-bold text-slate-200">Consulado en Boston, MA</p>
                      <p className="text-[10px] text-slate-400">31 St. James Ave, Boston</p>
                    </div>
                    <a href="tel:+16175366222" className="text-indigo-400 font-mono font-bold hover:underline">
                      +1 (617) 536-6222
                    </a>
                  </div>

                  {/* Newark / NY */}
                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <div>
                      <p className="font-bold text-slate-200">Consulado en Newark, NJ</p>
                      <p className="text-[10px] text-slate-400">550 Broad St, Newark</p>
                    </div>
                    <a href="tel:+18622797882" className="text-indigo-400 font-mono font-bold hover:underline">
                      +1 (862) 279-7882
                    </a>
                  </div>

                  {/* Orlando */}
                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <div>
                      <p className="font-bold text-slate-200">Consulado en Orlando, FL</p>
                      <p className="text-[10px] text-slate-400">3535 S Hiawassee Rd, Orlando</p>
                    </div>
                    <a href="tel:+14076504274" className="text-indigo-400 font-mono font-bold hover:underline">
                      +1 (407) 650-4274
                    </a>
                  </div>

                  {/* CIAC Cancillería */}
                  <div className="flex justify-between items-center pt-1">
                    <div>
                      <p className="font-bold text-slate-200">Cancillería Colombia 24/7 (CIAC)</p>
                      <p className="text-[10px] text-slate-400">Línea gratuita en EE.UU.</p>
                    </div>
                    <a href="tel:+18887643326" className="text-emerald-400 font-mono font-bold hover:underline">
                      +1 (888) 764-3326
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* SECCIÓN 2: ALOJAMIENTOS Y CONTACTO CON ANFITRIONES       */}
        {/* ======================================================== */}
        <section className="bg-slate-800/90 rounded-3xl p-5 border border-slate-700 shadow-md space-y-3">
          <div className="flex items-center gap-2">
            <Building size={18} className="text-emerald-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-300">
              Alojamientos del Viaje & Anfitriones
            </h2>
          </div>

          <div className="space-y-3">
            {accommodations.map((a) => {
              const fullAddr = a.city === 'Cambridge, MA'
                ? 'Cambridge, MA (Cerca de Harvard/MIT)'
                : a.city === 'Bayonne, NJ'
                  ? 'Bayonne, NJ (Acceso tren PATH)'
                  : a.city;

              return (
                <div key={a.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-extrabold text-white">{a.city}</h3>
                      <p className="text-[11px] text-slate-400">
                        {a.platform} {a.host ? `· Anfitrión: ${a.host}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {a.checkIn?.slice(0, 10)} → {a.checkOut?.slice(0, 10)}
                    </span>
                  </div>

                  {/* Dirección con botón de copia rápida */}
                  <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl text-xs">
                    <span className="text-slate-300 truncate mr-2 font-mono">{fullAddr}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(fullAddr)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                        title="Copiar dirección"
                      >
                        {copiedText === fullAddr ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg"
                        title="Ver en Google Maps"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  {a.notes && (
                    <p className="text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-800/60 p-2 rounded-xl">
                      ⚠️ {a.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECCIÓN 3: CÓDIGOS DE RESERVA CLAVE (VUELOS Y ENTRADAS)   */}
        {/* ======================================================== */}
        <section className="bg-slate-800/90 rounded-3xl p-5 border border-slate-700 shadow-md space-y-3">
          <div className="flex items-center gap-2">
            <Ticket size={18} className="text-indigo-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-indigo-300">
              Códigos de Reserva Críticos (PNR)
            </h2>
          </div>

          <div className="space-y-2">
            {/* Vuelo Ida */}
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-700 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-white">Vuelo Ida · Copa Airlines (CLO → PTY → BOS)</p>
                <p className="text-[10px] text-slate-400">12 de Octubre · Salida 12:06</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-extrabold text-amber-300 text-sm bg-black/40 px-2 py-0.5 rounded">
                  ABUMLB
                </span>
                <button
                  onClick={() => handleCopy('ABUMLB')}
                  className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700"
                >
                  {copiedText === 'ABUMLB' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Vuelo Regreso */}
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-700 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-white">Vuelo Regreso · United / Copa (MCO → IAH → PTY → CLO)</p>
                <p className="text-[10px] text-slate-400">29 de Octubre · Salida 07:00</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-extrabold text-amber-300 text-sm bg-black/40 px-2 py-0.5 rounded">
                  HDEETE / AB32PO
                </span>
                <button
                  onClick={() => handleCopy('HDEETE')}
                  className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700"
                >
                  {copiedText === 'HDEETE' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Estatua de la Libertad */}
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-700 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-white">Estatua de la Libertad (Pedestal Reserve)</p>
                <p className="text-[10px] text-slate-400">18 de Octubre · 08:30 Castle Clinton</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-extrabold text-amber-300 text-sm bg-black/40 px-2 py-0.5 rounded">
                  i85344872 / 85344871
                </span>
                <button
                  onClick={() => handleCopy('i85344872')}
                  className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700"
                >
                  {copiedText === 'i85344872' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECCIÓN 4: ESTACIONES PRINCIPALES & PUNTOS DE ENCUENTRO  */}
        {/* ======================================================== */}
        <section className="bg-slate-800/90 rounded-3xl p-5 border border-slate-700 shadow-md space-y-3">
          <div className="flex items-center gap-2">
            <Compass size={18} className="text-blue-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-blue-300">
              Terminales de Transporte & Puntos Clave
            </h2>
          </div>

          <div className="space-y-2 text-xs">
            {/* South Station Boston */}
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-700 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">Boston South Station (Terminal de Autobuses)</p>
                <p className="text-[10px] text-slate-400">700 Atlantic Ave, Boston, MA</p>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Boston+South+Station"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-indigo-400"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            {/* Port Authority NY */}
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-700 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">Port Authority Bus Terminal (Nueva York)</p>
                <p className="text-[10px] text-slate-400">625 8th Ave, New York, NY</p>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Port+Authority+Bus+Terminal"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-indigo-400"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            {/* Aeropuerto Newark EWR */}
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-700 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">Aeropuerto Internacional Newark (EWR)</p>
                <p className="text-[10px] text-slate-400">3 Brewster Rd, Newark, NJ</p>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Newark+Liberty+International+Airport"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-indigo-400"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            {/* Aeropuerto Orlando MCO */}
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-700 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">Aeropuerto Internacional de Orlando (MCO)</p>
                <p className="text-[10px] text-slate-400">1 Jeff Fuqua Blvd, Orlando, FL</p>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Orlando+International+Airport"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-indigo-400"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
