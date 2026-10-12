import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface TestLog {
  time: string;
  type: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  message: string;
}

export default function MapDiagnostics() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  const [activeTest, setActiveTest] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>('A');
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [tilesLoaded, setTilesLoaded] = useState<boolean>(false);
  const [mapIdle, setMapIdle] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('Iniciando...');

  const addLog = (type: TestLog['type'], message: string) => {
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { time, type, message }]);
    console.log(`[MapTest][${type}] ${message}`);
  };

  const runTest = async (testType: 'A' | 'B' | 'C' | 'D' | 'E' | 'F') => {
    setActiveTest(testType);
    setTilesLoaded(false);
    setMapIdle(false);
    setStatus(`Ejecutando Prueba ${testType}...`);
    addLog('INFO', `=== INICIANDO PRUEBA ${testType} ===`);

    const container = mapContainerRef.current;
    if (!container) {
      addLog('ERROR', 'Contenedor mapContainerRef.current es null.');
      setStatus('ERROR: Sin contenedor');
      return;
    }

    // Explicit dimensions verification
    addLog('INFO', `Dimensiones del contenedor: ${container.clientWidth}x${container.clientHeight}px`);

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

    addLog('INFO', `API Key presente: ${!!apiKey} (longitud: ${apiKey?.length || 0})`);
    addLog('INFO', `Map ID presente: ${!!mapId} (longitud: ${mapId?.length || 0})`);

    try {
      // Configure Loader
      setOptions({
        key: apiKey?.trim() || '',
        v: 'weekly',
        language: 'es',
        region: 'US',
        mapIds: testType === 'B' && mapId ? [mapId.trim()] : undefined,
      });

      addLog('INFO', 'Importando biblioteca "maps"...');
      const { Map } = await importLibrary('maps') as google.maps.MapsLibrary;
      addLog('SUCCESS', 'Biblioteca "maps" importada.');

      // Clear previous map if any
      container.innerHTML = '';

      // Test configurations:
      // Boston coordinates: 42.3601, -71.0558, zoom 12
      const bostonCenter = { lat: 42.3601, lng: -71.0558 };

      let mapOptions: google.maps.MapOptions = {
        center: bostonCenter,
        zoom: 12,
        mapTypeId: 'roadmap',
      };

      if (testType === 'A') {
        // Test A: Mapa básico con configuración predeterminada de cartografía (Roadmap puro, SIN Map ID, SIN estilos)
        addLog('INFO', 'Configuración A: Roadmap estándar sin mapId ni estilos');
        mapOptions = {
          center: bostonCenter,
          zoom: 12,
          mapTypeId: 'roadmap',
          disableDefaultUI: false,
        };
      } else if (testType === 'B') {
        // Test B: Mapa con VITE_GOOGLE_MAPS_MAP_ID configurado
        addLog('INFO', `Configuración B: Con mapId="${mapId}"`);
        mapOptions = {
          center: bostonCenter,
          zoom: 12,
          mapId: mapId?.trim(),
        };
      } else if (testType === 'C') {
        // Test C: Mapa explícito RASTER sin Map ID
        addLog('INFO', 'Configuración C: Raster mapTypeId roadmap explícito');
        mapOptions = {
          center: bostonCenter,
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          backgroundColor: '#e5e3df',
        };
      } else if (testType === 'D') {
        // Test D: Mapa básico + Marcador de prueba encima
        addLog('INFO', 'Configuración D: Roadmap estándar con marcador de prueba');
        mapOptions = {
          center: bostonCenter,
          zoom: 12,
          mapTypeId: 'roadmap',
        };
      } else if ((testType as string) === 'E') {
        // Test E: DEMO_MAP_ID
        addLog('INFO', 'Configuración E: mapId="DEMO_MAP_ID"');
        mapOptions = {
          center: bostonCenter,
          zoom: 12,
          mapId: 'DEMO_MAP_ID',
        };
      } else if ((testType as string) === 'F') {
        // Test F: User mapId with renderingType RASTER
        addLog('INFO', `Configuración F: mapId="${mapId}" con renderingType: RASTER`);
        mapOptions = {
          center: bostonCenter,
          zoom: 12,
          mapId: mapId?.trim(),
          renderingType: google.maps.RenderingType.RASTER,
        };
      }

      addLog('INFO', 'Instanciando new google.maps.Map()...');
      const map = new Map(container, mapOptions);
      mapInstanceRef.current = map;

      // Listeners
      map.addListener('tilesloaded', () => {
        setTilesLoaded(true);
        addLog('SUCCESS', 'EVENTO "tilesloaded" DISPARADO: La cartografía base ha terminado de renderizar mosaicos.');
        setStatus('CARTOGRAFÍA RENDERIZADA (tilesloaded OK)');
      });

      map.addListener('idle', () => {
        setMapIdle(true);
        addLog('INFO', 'EVENTO "idle" disparado.');
      });

      // If Test D, add marker
      if (testType === 'D') {
        try {
          const { Marker } = await importLibrary('marker') as google.maps.MarkerLibrary;
          new Marker({
            position: bostonCenter,
            map: map,
            title: 'Boston Common (Prueba D)',
          });
          addLog('SUCCESS', 'Marcador estándar agregado en Boston Common.');
        } catch (mErr: any) {
          addLog('ERROR', `Error al agregar marcador: ${mErr.message}`);
        }
      }

    } catch (err: any) {
      addLog('ERROR', `Excepción al inicializar mapa: ${err.message || String(err)}`);
      setStatus(`ERROR: ${err.message || String(err)}`);
    }
  };

  useEffect(() => {
    // Intercept window.gm_authFailure
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      addLog('ERROR', 'ALERTA: window.gm_authFailure() fue invocado por Google Maps. Clave rechazada o facturación/referrers no habilitados.');
      setStatus('ERROR DE AUTENTICACIÓN (gm_authFailure)');
      if (prevAuthFailure) prevAuthFailure();
    };

    // Run Test A by default on mount
    runTest('A');

    return () => {
      (window as any).gm_authFailure = prevAuthFailure;
    };
  }, []);

  return (
    <div className="p-4 bg-slate-900 text-white min-h-screen font-mono text-xs flex flex-col gap-4">
      {/* Test Controls Header */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-bold text-indigo-400">Prueba de Aislamiento Mínima — Google Maps</h1>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Centro: Boston (42.3601, -71.0558) | Zoom: 12 | Estado actual: <span className="font-bold text-amber-300">{status}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => runTest('A')}
            className={`px-3 py-1.5 rounded-lg font-bold ${activeTest === 'A' ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
          >
            Prueba A (Básico)
          </button>
          <button
            onClick={() => runTest('B')}
            className={`px-3 py-1.5 rounded-lg font-bold ${activeTest === 'B' ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
          >
            Prueba B (Con MapId)
          </button>
          <button
            onClick={() => runTest('C')}
            className={`px-3 py-1.5 rounded-lg font-bold ${activeTest === 'C' ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
          >
            Prueba C (Raster)
          </button>
          <button
            onClick={() => runTest('D')}
            className={`px-3 py-1.5 rounded-lg font-bold ${activeTest === 'D' ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
          >
            Prueba D (+Marcador)
          </button>
          <button
            onClick={() => runTest('E')}
            className={`px-3 py-1.5 rounded-lg font-bold ${activeTest === 'E' ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
          >
            Prueba E (DEMO_MAP_ID)
          </button>
          <button
            onClick={() => runTest('F')}
            className={`px-3 py-1.5 rounded-lg font-bold ${activeTest === 'F' ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
          >
            Prueba F (MapId+Raster)
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex gap-4 items-center bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
        <span className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${tilesLoaded ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`} />
          <span>tilesloaded: {tilesLoaded ? 'SÍ (Mosaicos Renderizados)' : 'NO (Esperando tiles...)'}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${mapIdle ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>idle: {mapIdle ? 'SÍ' : 'NO'}</span>
        </span>
      </div>

      {/* Map Container with EXPLICIT dimensions: 100% width, 450px height */}
      <div className="relative border-2 border-slate-700 rounded-xl overflow-hidden bg-[#e5e3df]">
        <div
          ref={mapContainerRef}
          id="isolation-map-canvas"
          style={{ width: '100%', height: '450px' }}
        />
      </div>

      {/* Execution Logs */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex-1 overflow-y-auto max-h-60">
        <h2 className="text-[11px] font-bold text-slate-400 mb-2 uppercase">Registro de Ejecución en Tiempo Real</h2>
        <div className="space-y-1">
          {logs.map((l, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-slate-500 font-mono">[{l.time}]</span>
              <span className={`font-bold ${
                l.type === 'SUCCESS' ? 'text-emerald-400' :
                l.type === 'ERROR' ? 'text-rose-400' :
                l.type === 'WARN' ? 'text-amber-400' : 'text-slate-300'
              }`}>
                [{l.type}]
              </span>
              <span className="text-slate-200">{l.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
