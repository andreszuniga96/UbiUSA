// src/services/TravelRiskEngine.ts
import { 
  TimelineEvent, TravelAlert, TransitPlan, Flight, Accommodation, TransportLeg, Activity 
} from '../domain/types';

export interface RiskAnalysis {
  status: 'SAFE' | 'WATCH' | 'RISK' | 'CRITICAL';
  alerts: TravelAlert[];
}

export class TravelRiskEngine {
  /**
   * Analiza el riesgo temporal inmediato entre el evento actual y el próximo evento.
   */
  static analyze(
    currentEvent: TimelineEvent | null,
    nextEvent: TimelineEvent | null,
    transit: TransitPlan | null,
    currentTimeMs: number,
    distanceMeters?: number
  ): RiskAnalysis {
    const alerts: TravelAlert[] = [];
    let highestStatus: 'SAFE' | 'WATCH' | 'RISK' | 'CRITICAL' = 'SAFE';

    const upgradeStatus = (newStatus: 'SAFE' | 'WATCH' | 'RISK' | 'CRITICAL') => {
      const severity = { 'SAFE': 0, 'WATCH': 1, 'RISK': 2, 'CRITICAL': 3 };
      if (severity[newStatus] > severity[highestStatus]) {
        highestStatus = newStatus;
      }
    };

    if (!nextEvent || !nextEvent.localTime) return { status: 'SAFE', alerts };

    const nextEventTime = new Date(`${nextEvent.date}T${nextEvent.localTime}`).getTime();
    const timeUntilNext = nextEventTime - currentTimeMs;
    const timeAvailableMin = Math.round(timeUntilNext / 60000);

    // 1. ¿Vamos retrasados?
    if (timeUntilNext < 0) {
      alerts.push({
        id: `alert-late-${nextEvent.id || 'curr'}`,
        type: 'CRITICAL',
        level: 'CRITICAL',
        category: 'TIMING',
        message: 'Llegas tarde a tu siguiente actividad.',
        cause: `La hora programada (${nextEvent.localTime}) ya ha pasado (${Math.abs(timeAvailableMin)} min de retraso).`,
        recommendedAction: 'Dirígete de inmediato al punto de encuentro o contacta al guía/anfitrión para avisar de tu demora.',
        timeAvailableMin: 0,
        relatedEntityId: nextEvent.id,
        createdAt: currentTimeMs
      });
      upgradeStatus('CRITICAL');
      return { status: highestStatus, alerts };
    }

    // 2. ¿Hay suficiente tiempo de traslado?
    if (transit) {
      const requiredTravelTimeMs = transit.durationMin * 60000;
      const bufferMs = 15 * 60000; // 15 mins buffer
      const transitAvailableMin = Math.floor((timeUntilNext - requiredTravelTimeMs) / 60000);

      if (timeUntilNext < requiredTravelTimeMs) {
        alerts.push({
          id: `alert-travel-${nextEvent.id || 'transit'}`,
          type: 'CRITICAL',
          level: 'CRITICAL',
          category: 'TRANSIT',
          message: 'El tiempo de traslado estimado es mayor al tiempo disponible.',
          cause: `El trayecto toma aproximadamente ${transit.durationMin} min pero solo dispones de ${timeAvailableMin} min.`,
          recommendedAction: 'Utiliza transporte prioritario (metro expreso o taxi/rideshare) para reducir el tiempo de viaje.',
          timeAvailableMin: transitAvailableMin,
          relatedEntityId: nextEvent.id,
          createdAt: currentTimeMs
        });
        upgradeStatus('CRITICAL');
      } else if (timeUntilNext < (requiredTravelTimeMs + bufferMs)) {
        alerts.push({
          id: `alert-travel-buffer-${nextEvent.id || 'buffer'}`,
          type: 'RISK',
          level: 'WATCH',
          category: 'TRANSIT',
          message: 'Tienes un margen muy ajustado para llegar a tiempo.',
          cause: `Margen de seguridad restante: solo ${transitAvailableMin} minutos por encima del tiempo de transporte (${transit.durationMin} min).`,
          recommendedAction: 'Inicia el desplazamiento inmediatamente para absorber posibles demoras en transporte público.',
          timeAvailableMin: transitAvailableMin,
          relatedEntityId: nextEvent.id,
          createdAt: currentTimeMs
        });
        upgradeStatus('RISK');
      }
    } else {
      // Sin plan de tránsito explícito: heurística de tiempo disponible
      if (timeUntilNext < 30 * 60000) {
        alerts.push({
          id: `alert-prep-${nextEvent.id || 'prep'}`,
          type: 'WATCH',
          level: 'WATCH',
          category: 'TIMING',
          message: 'Prepárate para salir hacia tu próxima actividad pronto.',
          cause: `Quedan ${timeAvailableMin} minutos para el inicio de ${(nextEvent as any).title || nextEvent.type}.`,
          recommendedAction: 'Revisa la ruta y dirígete al punto de encuentro con anticipación.',
          timeAvailableMin,
          relatedEntityId: nextEvent.id,
          createdAt: currentTimeMs
        });
        upgradeStatus('WATCH');
      }
    }

    // 3. Distancia física si está disponible
    if (distanceMeters !== undefined && distanceMeters > 3000 && timeAvailableMin < 25) {
      alerts.push({
        id: `alert-dist-${nextEvent.id || 'dist'}`,
        type: 'RISK',
        level: 'WATCH',
        category: 'TRANSIT',
        message: 'Distancia considerable al punto de encuentro.',
        cause: `Estás a ${(distanceMeters / 1000).toFixed(1)} km y restan ${timeAvailableMin} minutos.`,
        recommendedAction: 'No vayas a pie. Opta por metro o transporte rápido.',
        timeAvailableMin,
        relatedEntityId: nextEvent.id,
        createdAt: currentTimeMs
      });
      upgradeStatus('RISK');
    }

    // 4. Actividades consecutivas que se solapan
    if (currentEvent && currentEvent.localTime) {
      const currentEventTime = new Date(`${currentEvent.date}T${currentEvent.localTime}`).getTime();
      const assumedDurationMs = (currentEvent as any).durationMinutes 
        ? (currentEvent as any).durationMinutes * 60000 
        : 2 * 3600000; // 2 horas por defecto
      const currentEventEndTime = currentEventTime + assumedDurationMs;

      if (currentEventEndTime > nextEventTime) {
        const overlapMin = Math.round((currentEventEndTime - nextEventTime) / 60000);
        alerts.push({
          id: `alert-overlap-${currentEvent.id}-${nextEvent.id}`,
          type: 'CRITICAL',
          level: 'CRITICAL',
          category: 'TIMING',
          message: 'Tus actividades se solapan.',
          cause: `La actividad anterior finaliza después de la hora programada para la siguiente (conflicto de ~${overlapMin} min).`,
          recommendedAction: 'Ajusta la duración de la primera actividad o avisa al proveedor del segundo evento.',
          timeAvailableMin: 0,
          relatedEntityId: nextEvent.id,
          createdAt: currentTimeMs
        });
        upgradeStatus('CRITICAL');
      }
    }

    return { status: highestStatus, alerts };
  }

  /**
   * Evalúa la compatibilidad de horarios para un conjunto de eventos de un día
   */
  static analyzeScheduleCompatibility(dayEvents: TimelineEvent[]): TravelAlert[] {
    const alerts: TravelAlert[] = [];
    const sorted = [...dayEvents].filter(e => e.localTime).sort((a, b) => (a.localTime || '').localeCompare(b.localTime || ''));

    for (let i = 0; i < sorted.length - 1; i++) {
      const evA = sorted[i];
      const evB = sorted[i + 1];
      if (!evA.localTime || !evB.localTime) continue;

      const timeA = new Date(`${evA.date}T${evA.localTime}`).getTime();
      const timeB = new Date(`${evB.date}T${evB.localTime}`).getTime();
      const assumedDurationMin = (evA as any).durationMinutes || 120;
      const endA = timeA + (assumedDurationMin * 60000);

      const bufferMin = Math.round((timeB - endA) / 60000);

      if (bufferMin < 0) {
        alerts.push({
          id: `alert-conflict-${evA.id}-${evB.id}`,
          type: 'CRITICAL',
          level: 'CRITICAL',
          category: 'TIMING',
          message: `Conflicto de horario entre "${(evA as any).title || evA.type}" y "${(evB as any).title || evB.type}".`,
          cause: `La primera actividad concluye a las ${new Date(endA).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, solapándose con la segunda iniciada a las ${evB.localTime}.`,
          recommendedAction: 'Revisa el itinerario del día y reprograma una de las dos actividades.',
          timeAvailableMin: 0,
          relatedEntityId: evB.id,
          createdAt: Date.now()
        });
      } else if (bufferMin < 45) {
        alerts.push({
          id: `alert-tight-${evA.id}-${evB.id}`,
          type: 'WATCH',
          level: 'WATCH',
          category: 'TIMING',
          message: `Margen muy justo (${bufferMin} min) entre actividades.`,
          cause: `Solo dispones de ${bufferMin} min entre la finalización de "${(evA as any).title || evA.type}" y el inicio de "${(evB as any).title || evB.type}".`,
          recommendedAction: 'Planifica de antemano el metro o ruta a pie directa entre ambos puntos.',
          timeAvailableMin: bufferMin,
          relatedEntityId: evB.id,
          createdAt: Date.now()
        });
      }
    }

    return alerts;
  }

  /**
   * Evalúa reservas y compras pendientes críticas en el itinerario
   */
  static analyzePendingBookings(
    flights: Flight[],
    accommodations: Accommodation[],
    transport: TransportLeg[],
    activities: Activity[]
  ): TravelAlert[] {
    const alerts: TravelAlert[] = [];
    const now = Date.now();

    // Vuelos pendientes
    flights.filter(f => f.status === 'pendiente_compra' || f.status === 'pendiente_reserva').forEach(f => {
      alerts.push({
        id: `alert-pending-flight-${f.id}`,
        type: 'CRITICAL',
        level: 'CRITICAL',
        category: 'RESERVATION',
        message: `Vuelo interno pendiente de compra (${f.airline || 'EWR -> MCO'}).`,
        cause: 'El vuelo entre el área de Nueva York y Orlando no tiene código de reserva confirmado.',
        recommendedAction: 'Comprar los boletos aéreos de Spirit/Frontier o aerolínea de preferencia antes del inicio del viaje.',
        relatedEntityId: f.id,
        createdAt: now
      });
    });

    // Alojamientos pendientes
    accommodations.filter(a => a.status === 'pendiente_reserva' || a.status === 'pendiente').forEach(a => {
      alerts.push({
        id: `alert-pending-accom-${a.id}`,
        type: 'CRITICAL',
        level: 'CRITICAL',
        category: 'RESERVATION',
        message: `Alojamiento pendiente en ${a.city}.`,
        cause: `La estadía en ${a.city} (del ${a.checkIn?.slice(0, 10)} al ${a.checkOut?.slice(0, 10)}) aún no ha sido reservada.`,
        recommendedAction: 'Seleccionar hotel o Airbnb en Orlando cerca de Disney/Universal.',
        relatedEntityId: a.id,
        createdAt: now
      });
    });

    // Transporte terrestre pendiente (ej. bus nocturno Boston -> NY)
    transport.filter(t => t.status === 'pendiente_compra' || t.status === 'pendiente').forEach(t => {
      alerts.push({
        id: `alert-pending-transport-${t.id}`,
        type: 'WATCH',
        level: 'WATCH',
        category: 'RESERVATION',
        message: `Transporte nocturno pendiente: ${t.origin} → ${t.destination}.`,
        cause: `El trayecto de autobús del ${t.date} no tiene boletos comprados aún.`,
        recommendedAction: 'Comprar boletos con antelación en Peter Pan, Greyhound o FlixBus para garantizar asientos.',
        relatedEntityId: t.id,
        createdAt: now
      });
    });

    // Actividades pendientes de compra
    activities.filter(act => act.status === 'pendiente_compra').forEach(act => {
      alerts.push({
        id: `alert-pending-activity-${act.id}`,
        type: 'WATCH',
        level: 'WATCH',
        category: 'RESERVATION',
        message: `Entrada pendiente: ${act.title}.`,
        cause: 'Esta actividad requiere compra previa para garantizar acceso.',
        recommendedAction: 'Gestionar la compra del pase o ticket oficial en la web del proveedor.',
        relatedEntityId: act.id,
        createdAt: now
      });
    });

    return alerts;
  }

  /**
   * Evalúa transiciones nocturnas y check-in complejos
   */
  static analyzeNocturnalTransitions(targetDate: string): TravelAlert[] {
    const alerts: TravelAlert[] = [];
    const now = Date.now();

    if (targetDate === '2026-10-12' || targetDate === '2026-10-13') {
      alerts.push({
        id: 'alert-night-boston-arrival',
        type: 'CRITICAL',
        level: 'CRITICAL',
        category: 'LOGISTICS',
        message: 'Llegada nocturna y check-in de madrugada en Cambridge (Airbnb Lynne).',
        cause: 'El vuelo aterriza en Boston a las 23:43 del 12 de oct. El traslado hacia Cambridge llegará entre las 00:30 y 01:00 del 13 de oct.',
        recommendedAction: 'Reconfirmar con Lynne el código de caja de seguridad o protocolo de auto-check-in nocturno.',
        createdAt: now
      });
    }

    if (targetDate === '2026-10-15' || targetDate === '2026-10-16') {
      alerts.push({
        id: 'alert-night-bus-ny-arrival',
        type: 'WATCH',
        level: 'WATCH',
        category: 'LOGISTICS',
        message: 'Llegada en autobús nocturno a las 04:30 AM (Port Authority, NY).',
        cause: 'El autobús de Boston llega antes del amanecer del 16 de oct. El check-in oficial en Bayonne (Airbnb Carmelo) es a las 16:00.',
        recommendedAction: 'Coordinar con Carmelo dejar el equipaje en la mañana temprano en Bayonne, o usar consigna en Manhattan.',
        createdAt: now
      });
    }

    if (targetDate === '2026-10-21') {
      alerts.push({
        id: 'alert-ny-gap-night-21',
        type: 'CRITICAL',
        level: 'CRITICAL',
        category: 'LOGISTICS',
        message: 'Noche del 21 de octubre sin alojamiento asegurado en NY/NJ.',
        cause: 'El check-out con Carmelo concluye el 21 de oct a las 10:00 y ese día hay excursión a Washington D.C. regresando a las 21:00.',
        recommendedAction: 'Extender con Carmelo o reservar hotel para pernoctar al regresar de Washington.',
        createdAt: now
      });
    }

    if (targetDate === '2026-10-22' || targetDate === '2026-10-23') {
      alerts.push({
        id: 'alert-niagara-night-trip',
        type: 'WATCH',
        level: 'INFO',
        category: 'LOGISTICS',
        message: 'Excursión nocturna a Cataratas del Niágara.',
        cause: 'Salida a las 23:00 del 22 de oct. La noche se duerme en el autobús y el regreso es a las 21:00 del 23 de oct.',
        recommendedAction: 'Llevar abrigo, almohada de viaje y reservar hospedaje en NY para las noches del 23 y 24 de oct.',
        createdAt: now
      });
    }

    if (targetDate === '2026-10-29') {
      alerts.push({
        id: 'alert-return-connection-tight',
        type: 'WATCH',
        level: 'WATCH',
        category: 'TIMING',
        message: 'Margen de conexión ajustado en Houston (IAH): solo 49 minutos.',
        cause: 'Vuelo UA 468 llega a IAH a las 08:45 y el UA 1916 parte a las 09:34 rumbo a Panamá.',
        recommendedAction: 'Desembarcar con agilidad en IAH y dirigirse directamente a la puerta de conexión sin detenerse.',
        timeAvailableMin: 49,
        createdAt: now
      });
    }

    return alerts;
  }
}
