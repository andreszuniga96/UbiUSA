import React from 'react';
import { 
  MapPin, Clock, Phone, Globe, Info, Sparkles, Camera, Utensils, 
  Coffee, Compass, Navigation, ExternalLink, X, Footprints, ShieldCheck 
} from 'lucide-react';
import { Place } from '../../domain/types';

export interface PlaceDetailCardProps {
  place: Place;
  distanceMeters?: number;
  walkingMinutes?: number;
  onClose?: () => void;
  onNavigate?: () => void;
  onFindNearby?: (category: string) => void;
}

export const PlaceDetailCard: React.FC<PlaceDetailCardProps> = ({
  place,
  distanceMeters,
  walkingMinutes,
  onClose,
  onNavigate,
  onFindNearby,
}) => {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    place.name + (place.address ? ` ${place.address}` : '')
  )}`;

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header bar */}
      <div className="bg-gray-900 text-white p-4 px-6 flex items-start justify-between relative overflow-hidden shrink-0">
        <div className="relative z-10 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {place.category || 'Lugar de Interés'}
            </span>
            {place.source && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <ShieldCheck size={12} /> Verificado
              </span>
            )}
          </div>
          <h3 className="text-xl font-extrabold text-white leading-tight">{place.name}</h3>
          {place.address && (
            <p className="text-xs text-gray-300 flex items-center gap-1 mt-1">
              <MapPin size={12} className="shrink-0 text-indigo-400" />
              <span className="line-clamp-1">{place.address}</span>
            </p>
          )}
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 transition-colors"
            aria-label="Cerrar detalle"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Body scroll */}
      <div className="p-6 overflow-y-auto space-y-5 text-sm">
        {/* Distance & Walking Badge */}
        {(distanceMeters !== undefined || walkingMinutes !== undefined) && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <Footprints size={16} className="text-indigo-600" />
              <span>A pie desde tu ubicación:</span>
            </div>
            <div className="text-right">
              {walkingMinutes !== undefined && (
                <span className="text-sm font-extrabold text-indigo-700 mr-2">~{walkingMinutes} min</span>
              )}
              {distanceMeters !== undefined && (
                <span className="text-xs text-indigo-500 font-semibold">({Math.round(distanceMeters)} m)</span>
              )}
            </div>
          </div>
        )}

        {/* Practical details (Horario, Teléfono, Web) */}
        {(place.openingHours || place.phone || place.website) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl">
            {place.openingHours && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400 shrink-0" />
                <span><strong>Horario:</strong> {place.openingHours}</span>
              </div>
            )}
            {place.phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <a href={`tel:${place.phone}`} className="hover:underline text-indigo-600 font-medium">
                  {place.phone}
                </a>
              </div>
            )}
            {place.website && (
              <div className="flex items-center gap-2 col-span-full">
                <Globe size={14} className="text-gray-400 shrink-0" />
                <a 
                  href={place.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:underline text-indigo-600 font-medium truncate"
                >
                  {place.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {place.description && (
          <div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1 flex items-center gap-1">
              <Info size={12} /> Descripción
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">{place.description}</p>
          </div>
        )}

        {/* History */}
        {place.history && (
          <div className="bg-amber-50 border border-amber-100/80 rounded-2xl p-4">
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-amber-800 mb-1 flex items-center gap-1.5">
              <Compass size={14} className="text-amber-600" /> Contexto Histórico
            </h4>
            <p className="text-amber-950 text-xs leading-relaxed">{place.history}</p>
          </div>
        )}

        {/* Highlights */}
        {place.highlights && place.highlights.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2 flex items-center gap-1">
              <Sparkles size={12} className="text-indigo-500" /> Qué observar
            </h4>
            <ul className="space-y-1 text-xs text-gray-700">
              {place.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Fun Fact */}
        {place.funFact && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-blue-800 mb-1 flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-500" /> Dato Curioso
            </h4>
            <p className="text-blue-950 text-xs leading-relaxed">{place.funFact}</p>
          </div>
        )}

        {/* Photo Tip */}
        {place.photoTip && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-rose-800 mb-1 flex items-center gap-1.5">
              <Camera size={14} className="text-rose-500" /> Consejo Fotográfico
            </h4>
            <p className="text-rose-950 text-xs leading-relaxed">{place.photoTip}</p>
          </div>
        )}

        {/* Nearby Shortcuts */}
        {onFindNearby && (
          <div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">
              Explorar alrededor
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onFindNearby('restaurant')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gray-50 hover:bg-rose-50 text-gray-700 hover:text-rose-700 border border-gray-100 text-xs font-bold transition-colors"
              >
                <Utensils size={14} className="text-rose-500" /> Comida cerca
              </button>
              <button 
                onClick={() => onFindNearby('cafe')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-700 border border-gray-100 text-xs font-bold transition-colors"
              >
                <Coffee size={14} className="text-amber-500" /> Café cerca
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2 shrink-0">
        {onNavigate && (
          <button 
            onClick={onNavigate}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-colors"
          >
            <Navigation size={16} /> Cómo llegar
          </button>
        )}
        <a 
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <ExternalLink size={16} /> Ver en Google Maps
        </a>
      </div>
    </div>
  );
};
