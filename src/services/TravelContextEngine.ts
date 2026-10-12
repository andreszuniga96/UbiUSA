import { TimelineEvent, TransitPlan, TravelAlert, Task } from '../domain/types';
import { TravelRiskEngine } from './TravelRiskEngine';
import { VERIFIED_TOURS_DATA } from '../data/seed/verifiedToursData';
import { CuratedFoodPlace, VERIFIED_FOOD_PLACES } from './RecommendationEngine';

export interface PreTripContext {
  isBeforeTrip: boolean;
  daysUntilTrip: number;
  departureDate: string;
  firstFlight: {
    airline: string;
    bookingCode: string;
    departureTime: string;
    route: string;
  };
  criticalTasksCount: number;
  criticalAlerts: TravelAlert[];
  concreteActions: {
    id: string;
    title: string;
    deadline: string;
    urgency: 'ALTA' | 'MEDIA';
    actionLink: string;
  }[];
}

export interface InTripContext {
  date: string;
  city: string;
  timeZone: string;
  timeZoneAbbr: string;
  currentEvent: TimelineEvent | null;
  nextEvent: TimelineEvent | null;
  allDayEvents: TimelineEvent[];
  meetingPoint: string;
  meetingPointAddress?: string;
  meetingPointCoords?: { lat: number; lng: number };
  navigationUrl: string;
  leaveByMs: number | null;
  leaveByFormatted: string;
  transitEstimateMin: number;
  marginMin: number;
  freeTimeMinutes: number;
  status: 'SAFE' | 'WATCH' | 'RISK' | 'CRITICAL';
  alerts: TravelAlert[];
  recommendedFood: CuratedFoodPlace[];
  requiredBookings: {
    code: string;
    label: string;
    status: string;
    notes?: string;
  }[];
  isNocturnalTransition: boolean;
  nocturnalNote?: string;
}

export class TravelContextEngine {
  /**
   * Obtiene la zona horaria IANA correspondiente a la ciudad
   */
  static getTimezoneForCity(city: string): { iana: string; abbr: string } {
    const c = city.toLowerCase();
    if (c.includes('cali') || c.includes('colombia')) {
      return { iana: 'America/Bogota', abbr: 'COT' };
    }
    // Boston, Nueva York, Bayonne, Washington D.C., Orlando están en la costa este (Eastern Time)
    // En octubre aplica Eastern Daylight Time (EDT, UTC-4)
    return { iana: 'America/New_York', abbr: 'EDT' };
  }

  /**
   * Evalúa el estado previo al viaje (Pre-Trip)
   */
  static evaluatePreTrip(
    nowTimestamp: number,
    alerts: TravelAlert[],
    tasks: Task[]
  ): PreTripContext {
    const tripStart = new Date('2026-10-12T00:00:00').getTime();
    const diffMs = tripStart - nowTimestamp;
    const daysUntilTrip = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isBeforeTrip = nowTimestamp < tripStart;

    const criticalTasks = tasks.filter(t => t.priority === 'CRITICO' && t.status === 'PENDING');

    const concreteActions = [
      {
        id: 'act-lynne-night',
        title: 'Confirmar acceso nocturno con Lynne (Airbnb Cambridge)',
        deadline: 'Antes del 12 de octubre',
        urgency: 'ALTA' as const,
        actionLink: '/reservas',
      },
      {
        id: 'act-boston-luggage',
        title: 'Gestionar almacenamiento de equipaje en Boston el 15 de octubre',
        deadline: '15 de octubre',
        urgency: 'ALTA' as const,
        actionLink: '/tareas',
      },
      {
        id: 'act-bus-ticket',
        title: 'Comprar boletos de autobús nocturno Boston - Nueva York',
        deadline: 'Para la noche del 15 de octubre',
        urgency: 'ALTA' as const,
        actionLink: '/tareas',
      },
      {
        id: 'act-carmelo-luggage',
        title: 'Coordinar con Carmelo dejar maletas en Bayonne temprano el 16 de oct',
        deadline: '16 de octubre (04:30 llegada)',
        urgency: 'ALTA' as const,
        actionLink: '/tareas',
      },
      {
        id: 'act-ny-gap-lodging',
        title: 'Resolver hospedaje en NY/NJ para las noches del 21, 23 y 24 de oct',
        deadline: 'Crítico antes del viaje',
        urgency: 'ALTA' as const,
        actionLink: '/tareas',
      },
      {
        id: 'act-internal-flight',
        title: 'Comprar vuelo interno Newark (EWR) - Orlando (MCO)',
        deadline: 'Fecha propuesta 25 o 26 de oct',
        urgency: 'ALTA' as const,
        actionLink: '/reservas',
      },
      {
        id: 'act-orlando-lodging',
        title: 'Reservar alojamiento en Orlando del 25/26 al 29 de octubre',
        deadline: 'Crítico antes del viaje',
        urgency: 'ALTA' as const,
        actionLink: '/reservas',
      },
    ];

    return {
      isBeforeTrip,
      daysUntilTrip,
      departureDate: '2026-10-12',
      firstFlight: {
        airline: 'Copa Airlines',
        bookingCode: 'ABUMLB',
        departureTime: '12:06',
        route: 'CLO (Cali) → PTY (Panamá) → BOS (Boston)',
      },
      criticalTasksCount: criticalTasks.length,
      criticalAlerts: alerts.filter(a => a.type === 'CRITICAL' || a.type === 'WATCH'),
      concreteActions,
    };
  }

  /**
   * Evalúa el asistente contextual durante el viaje para una fecha y hora específicas
   */
  static evaluateInTrip(
    targetDate: string,
    simulatedTimeMs: number,
    events: TimelineEvent[],
    alerts: TravelAlert[] = [],
    dismissedAlertIds: string[] = []
  ): InTripContext {
    // Filter events for targetDate
    const dayEvents = events
      .filter(e => e.date === targetDate)
      .sort((a, b) => {
        const timeA = a.localTime || '00:00';
        const timeB = b.localTime || '00:00';
        return timeA.localeCompare(timeB);
      });

    // Determine city
    let city = 'Estados Unidos';
    const firstAccom = events.find(e => e.type === 'accommodation' && e.date <= targetDate) as any;
    if (firstAccom) city = firstAccom.city;

    if (targetDate >= '2026-10-12' && targetDate <= '2026-10-15') city = 'Boston, MA';
    else if (targetDate >= '2026-10-16' && targetDate <= '2026-10-24') city = 'Nueva York / Bayonne';
    else if (targetDate >= '2026-10-25') city = 'Orlando, FL';

    const tzInfo = this.getTimezoneForCity(city);

    let currentEvent: TimelineEvent | null = null;
    let nextEvent: TimelineEvent | null = null;

    for (const ev of dayEvents) {
      if (!ev.localTime) continue;
      const evTime = new Date(`${ev.date}T${ev.localTime}`).getTime();
      const assumedDuration = (ev as any).durationMinutes 
        ? (ev as any).durationMinutes * 60000 
        : 2.5 * 3600000; // 2.5 hours default

      if (simulatedTimeMs >= evTime && simulatedTimeMs < evTime + assumedDuration) {
        currentEvent = ev;
      } else if (evTime > simulatedTimeMs && !nextEvent) {
        nextEvent = ev;
      }
    }

    if (!nextEvent && dayEvents.length > 0) {
      nextEvent = dayEvents[0];
    }

    // Meeting point info
    let meetingPoint = 'Punto por confirmar';
    let meetingPointAddress: string | undefined = undefined;
    let meetingPointCoords: { lat: number; lng: number } | undefined = undefined;

    if (nextEvent) {
      const bundle = VERIFIED_TOURS_DATA[nextEvent.id];
      if (bundle) {
        meetingPoint = bundle.tour.meetingPoint || bundle.tour.title;
        meetingPointAddress = bundle.tour.meetingPointAddress;
        meetingPointCoords = bundle.tour.meetingPointCoords;
      } else if ((nextEvent as any).meetingPoint) {
        meetingPoint = (nextEvent as any).meetingPoint;
        meetingPointAddress = (nextEvent as any).meetingPointAddress || (nextEvent as any).location;
      } else if (nextEvent.type === 'flight') {
        const seg = (nextEvent as any).segments?.[0];
        meetingPoint = `Aeropuerto ${seg?.origin || 'Salida'}`;
        meetingPointAddress = `${seg?.origin || 'Aeropuerto'}, Terminal de Salida`;
      } else if (nextEvent.type === 'accommodation') {
        meetingPoint = `Check-in: ${(nextEvent as any).city}`;
        meetingPointAddress = (nextEvent as any).address || (nextEvent as any).city;
      } else if (nextEvent.type === 'transport') {
        meetingPoint = `Terminal: ${(nextEvent as any).origin}`;
        meetingPointAddress = (nextEvent as any).origin;
      } else if ((nextEvent as any).location) {
        meetingPoint = (nextEvent as any).location;
        meetingPointAddress = (nextEvent as any).location;
      }
    }

    // URL de navegación externa directa a Google Maps
    let navigationUrl = 'https://www.google.com/maps';
    if (meetingPointCoords) {
      navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${meetingPointCoords.lat},${meetingPointCoords.lng}`;
    } else if (meetingPointAddress) {
      navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(meetingPointAddress)}`;
    } else if (meetingPoint && meetingPoint !== 'Punto por confirmar') {
      navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(meetingPoint + ' ' + city)}`;
    }

    // Transit & Timing calculation
    const transitEstimateMin = 30; // standard NYC/Boston public transit estimate
    const marginMin = 15; // safety margin

    let leaveByMs: number | null = null;
    let leaveByFormatted = '--:--';
    let freeTimeMinutes = 0;

    if (nextEvent && nextEvent.localTime && nextEvent.localTime.includes(':')) {
      const nextTime = new Date(`${nextEvent.date}T${nextEvent.localTime}`).getTime();
      leaveByMs = nextTime - ((transitEstimateMin + marginMin) * 60000);
      leaveByFormatted = new Date(leaveByMs).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      const diffToLeave = leaveByMs - simulatedTimeMs;
      freeTimeMinutes = Math.max(0, Math.floor(diffToLeave / 60000));
    }

    // Required bookings & documents for next event
    const requiredBookings: { code: string; label: string; status: string; notes?: string }[] = [];
    if (nextEvent) {
      const rawCodes = (nextEvent as any).bookingCodes || [];
      rawCodes.forEach((code: string) => {
        requiredBookings.push({
          code,
          label: (nextEvent as any).title || nextEvent.type,
          status: nextEvent.status,
          notes: nextEvent.notes,
        });
      });
      if (rawCodes.length === 0 && (nextEvent as any).provider) {
        requiredBookings.push({
          code: 'Sin código (Reserva por Nombre)',
          label: (nextEvent as any).provider,
          status: nextEvent.status,
          notes: nextEvent.notes,
        });
      }
    }

    // Risk analysis
    const transitPlan: TransitPlan = {
      id: 'plan-dyn',
      routePlanId: 'route-dyn',
      transportType: '🚇 SUBWAY',
      durationMin: transitEstimateMin,
      transfers: 1,
      isFaster: true,
      source: 'STATIC',
    };

    const immediateRisk = TravelRiskEngine.analyze(currentEvent, nextEvent, transitPlan, simulatedTimeMs);
    const scheduleAlerts = TravelRiskEngine.analyzeScheduleCompatibility(dayEvents);
    const nocturnalAlerts = TravelRiskEngine.analyzeNocturnalTransitions(targetDate);

    // Nocturnal info flag
    const isNocturnalTransition = nocturnalAlerts.length > 0;
    const nocturnalNote = nocturnalAlerts[0]?.message;

    // Combine alerts avoiding duplicates
    const allCandidateAlerts: TravelAlert[] = [
      ...immediateRisk.alerts,
      ...scheduleAlerts,
      ...nocturnalAlerts,
      ...alerts.filter(a => a.relatedEntityId === nextEvent?.id)
    ];

    const uniqueAlertMap = new Map<string, TravelAlert>();
    allCandidateAlerts.forEach(al => {
      if (!uniqueAlertMap.has(al.id)) {
        uniqueAlertMap.set(al.id, al);
      }
    });

    // Filter out dismissed alerts
    const finalAlerts = Array.from(uniqueAlertMap.values()).filter(
      al => !dismissedAlertIds.includes(al.id)
    );

    // Recommended food places based on city and free time
    const nearbyFoodCandidates = VERIFIED_FOOD_PLACES.filter(f => {
      const placeCity = f.city.toLowerCase();
      const currentCity = city.toLowerCase();
      return (
        (currentCity.includes('boston') && placeCity.includes('boston')) ||
        (currentCity.includes('nueva york') && placeCity.includes('new york')) ||
        (currentCity.includes('bayonne') && placeCity.includes('new york')) ||
        (currentCity.includes('orlando') && placeCity.includes('orlando'))
      );
    }).slice(0, 3);

    return {
      date: targetDate,
      city,
      timeZone: tzInfo.iana,
      timeZoneAbbr: tzInfo.abbr,
      currentEvent,
      nextEvent,
      allDayEvents: dayEvents,
      meetingPoint,
      meetingPointAddress,
      meetingPointCoords,
      navigationUrl,
      leaveByMs,
      leaveByFormatted,
      transitEstimateMin,
      marginMin,
      freeTimeMinutes,
      status: immediateRisk.status,
      alerts: finalAlerts,
      recommendedFood: nearbyFoodCandidates,
      requiredBookings,
      isNocturnalTransition,
      nocturnalNote,
    };
  }
}
