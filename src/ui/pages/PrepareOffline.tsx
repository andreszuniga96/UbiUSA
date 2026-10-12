import { useState } from 'react';

export default function PrepareOffline() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startDownload = () => {
    setDownloading(true);
    setProgress(0);
    
    // Simular descarga de mapas y datos
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setDownloading(false);
          return 100;
        }
        return p + 10;
      });
    }, 300);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Preparar Viaje (Offline)</h2>
      <p className="text-gray-600">
        Descarga todos los datos, reservas y mapas para acceder a ellos sin conexión durante el viaje.
      </p>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg mb-4">Estado de Descarga</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Itinerario y Reservas</span>
            <span className="text-green-600 font-bold">100% (Sincronizado)</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span>Mapas (Tiles OSM)</span>
            {progress === 100 ? (
              <span className="text-green-600 font-bold">Completado</span>
            ) : downloading ? (
              <span className="text-indigo-600 font-bold">{progress}%</span>
            ) : (
              <span className="text-gray-400">Pendiente</span>
            )}
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <button 
          onClick={startDownload}
          disabled={downloading || progress === 100}
          className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-300 transition-colors"
        >
          {downloading ? 'Descargando...' : progress === 100 ? 'Todo Listo' : 'Descargar Datos Offline'}
        </button>
      </div>

      <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
        <h4 className="font-bold text-orange-800 mb-2">Aviso Legal Maps</h4>
        <p className="text-sm text-orange-700">
          Por los TOS de Google Maps Platform, no se guardan mapas de Google offline. 
          En modo sin conexión, la app usará mapas de OpenStreetMap oxidados localmente, 
          permitidos para uso libre en caché. Solo se guardan los Place IDs de Google.
        </p>
      </div>
    </div>
  );
}
