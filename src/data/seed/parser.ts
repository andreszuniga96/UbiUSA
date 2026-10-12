import { TRIP_SOURCE_DATA } from './tripSource';
import { VERIFIED_TOURS_DATA } from './verifiedToursData';
import { 
  Flight, Accommodation, Activity, TransportLeg, Task, TimelineEvent, Trip, 
  Tour, TourStop, TourSession, Place, TravelAlert, Document, DayPlan, Traveler 
} from '../../domain/types';

export interface ParsedTripBundle {
  trip: Trip;
  travelers: Traveler[];
  events: TimelineEvent[];
  flights: Flight[];
  accommodations: Accommodation[];
  activities: Activity[];
  transport: TransportLeg[];
  tours: Tour[];
  tourStops: TourStop[];
  tourSessions: TourSession[];
  tasks: Task[];
  places: Place[];
  alerts: TravelAlert[];
  documents: Document[];
  days: DayPlan[];
}

export function parseTripData(): ParsedTripBundle {
  const now = Date.now();

  // 1. Trip Metadata
  const trip: Trip = {
    id: 'usa-trip-2026',
    title: 'USA Travel Companion — Iván & Gloria',
    startDate: TRIP_SOURCE_DATA.viaje.fechas.inicio,
    endDate: TRIP_SOURCE_DATA.viaje.fechas.fin,
    memberEmails: ['ivan.zuniga@example.com', 'gloria.romo@example.com'],
    dataVersion: 3,
  };

  // 2. Travelers
  const travelers: Traveler[] = TRIP_SOURCE_DATA.viaje.pasajeros.map((name, i) => ({
    id: `traveler-${i}`,
    name,
    preferences: {
      budgetLevel: 'MEDIUM',
      foodBudgetPerPerson: 40,
      transportBudgetPerDay: 20,
    }
  }));

  const events: TimelineEvent[] = [];
  const flights: Flight[] = [];
  const accommodations: Accommodation[] = [];
  const activities: Activity[] = [];
  const transport: TransportLeg[] = [];
  const tours: Tour[] = [];
  const tourStops: TourStop[] = [];
  const tourSessions: TourSession[] = [];
  const tasks: Task[] = [];
  const places: Place[] = [];
  const alerts: TravelAlert[] = [];
  const documents: Document[] = [];
  const days: DayPlan[] = [];

  // 3. Parse Flights (Ida, Interno, Regreso)
  TRIP_SOURCE_DATA.vuelos.forEach((vueloObj, i) => {
    const vuelo = vueloObj as any;
    const isIda = vuelo.tipo === 'ida';
    const isRegreso = vuelo.tipo === 'regreso';
    const isInterno = vuelo.tipo === 'interno';

    const bookingCodes = vuelo.codigos_reserva || (vuelo.codigo_reserva ? [vuelo.codigo_reserva] : []);

    const flight: Flight = {
      id: `flight-${vuelo.tipo}-${i}`,
      type: 'flight',
      flightType: vuelo.tipo as any,
      date: isIda ? '2026-10-12' : isRegreso ? '2026-10-29' : '2026-10-25',
      localTime: isIda ? '12:06' : isRegreso ? '07:00' : undefined,
      airline: vuelo.aerolinea || vuelo.aerolineas || '',
      bookingCodes,
      status: vuelo.estado as any,
      timePrecision: isInterno ? 'aproximada' : 'exacta',
      notes: isRegreso ? 'Conexión ajustada en IAH (59 min) y escala técnica en PTY.' : undefined,
      segments: vuelo.trayectos ? vuelo.trayectos.map((t: any) => ({
        flightNumber: t.vuelo,
        origin: t.origen,
        destination: t.destino,
        departureTime: t.salida,
        arrivalTime: t.llegada
      })) : [],
      updatedAt: now,
    };

    flights.push(flight);
    events.push(flight);

    // Documents from flight bookings
    if (bookingCodes.length > 0) {
      bookingCodes.forEach((code: string) => {
        documents.push({
          id: `doc-flight-${code}`,
          title: `Reserva ${flight.airline} (${code})`,
          category: 'CONFIRMATION',
          relatedEntityId: flight.id,
          availability: 'AVAILABLE_OFFLINE',
          notes: `Código de reserva oficial: ${code}`,
          updatedAt: now,
        });
      });
    }

    // Return Flight Alert
    if (isRegreso) {
      alerts.push({
        id: 'alert-return-connection',
        type: 'WATCH',
        message: 'Vuelo de regreso (29 de octubre): Verificar margen de conexión en Houston (IAH) de 08:45 a 09:34 (49 min) y traslado matutino a MCO.',
        relatedEntityId: flight.id,
        createdAt: now,
      });
    }
  });

  // 4. Parse Accommodations
  TRIP_SOURCE_DATA.alojamientos.forEach((aloj, i) => {
    const isCambridge = aloj.ciudad.toLowerCase().includes('cambridge');
    const isBayonne = aloj.ciudad.toLowerCase().includes('bayonne');
    const isOrlando = aloj.ciudad.toLowerCase().includes('orlando');

    const checkInDate = aloj.check_in.includes('T') ? aloj.check_in.split('T')[0] : (isOrlando ? '2026-10-25' : aloj.check_in);
    const checkInTime = aloj.check_in.includes('T') ? aloj.check_in.split('T')[1].slice(0, 5) : undefined;

    const accom: Accommodation = {
      id: `accom-${i}`,
      type: 'accommodation',
      city: aloj.ciudad,
      platform: aloj.plataforma,
      host: aloj.anfitrion,
      checkIn: aloj.check_in,
      checkOut: aloj.check_out,
      status: aloj.estado as any,
      date: checkInDate,
      localTime: checkInTime,
      timePrecision: aloj.check_in.includes('T') ? 'exacta' : 'aproximada',
      notes: aloj.alerta || (isCambridge ? 'Vuelo llega a Boston a las 23:02 del 12 de octubre; llegada estimada al Airbnb ~01:00 del 13. Confirmar acceso nocturno con Lynne.' : undefined),
      placeId: isCambridge ? 'place-cambridge-airbnb' : isBayonne ? 'place-bayonne-airbnb' : undefined,
      updatedAt: now,
    };

    accommodations.push(accom);
    events.push(accom);

    // Alerts for accommodations
    if (isCambridge) {
      alerts.push({
        id: 'alert-cambridge-late-checkin',
        type: 'CRITICAL',
        message: 'Acceso nocturno Cambridge: El vuelo llega a BOS a las 23:02 del 12 de oct. Se estima llegar al Airbnb de Lynne hacia la 01:00 del 13 de oct. Confirmar instrucciones de entrada con la anfitriona.',
        relatedEntityId: accom.id,
        createdAt: now,
      });

      places.push({
        id: 'place-cambridge-airbnb',
        name: 'Airbnb Cambridge (Lynne)',
        address: 'Cambridge, MA (Cerca de Harvard/Central Sq)',
        lat: 42.3736,
        lng: -71.1097,
        precision: 'ciudad',
        source: 'CURATED',
        category: 'Alojamiento',
        description: 'Alojamiento confirmado del 12 al 15 de octubre. Anfitriona: Lynne.',
      });
    }

    if (isBayonne) {
      alerts.push({
        id: 'alert-bayonne-gap-nights',
        type: 'CRITICAL',
        message: 'Alerta de Alojamiento NY/NJ: Se requiere resolver hospedaje para las noches del 21, 23 y 24 de octubre tras el check-out de Bayonne.',
        relatedEntityId: accom.id,
        createdAt: now,
      });

      places.push({
        id: 'place-bayonne-airbnb',
        name: 'Airbnb Bayonne (Carmelo)',
        address: 'Bayonne, NJ (Acceso HBLR a Manhattan)',
        lat: 40.6687,
        lng: -74.1143,
        precision: 'ciudad',
        source: 'CURATED',
        category: 'Alojamiento',
        description: 'Alojamiento confirmado del 16 al 21 de octubre. Anfitrión: Carmelo.',
      });
    }
  });

  // 5. Parse Ground Transport (Boston -> NYC Bus)
  TRIP_SOURCE_DATA.transporte_terrestre.forEach((trans, i) => {
    const leg: TransportLeg = {
      id: `trans-${i}`,
      type: 'transport',
      transportType: 'bus',
      date: trans.fecha, // 2026-10-15
      origin: trans.origen,
      destination: trans.destino,
      departureTime: trans.hora_salida, // "24:00 (Aprox)"
      departureTimeNormalized: '2026-10-16T00:00:00', // Normalizado para cálculos de medianoche
      arrivalTime: trans.hora_llegada, // "04:30 del 16 de octubre (Aprox)"
      arrivalDate: '2026-10-16',
      status: trans.estado as any,
      timePrecision: 'aproximada',
      notes: 'Autobús nocturno Boston South Station -> NY Port Authority. Salida aproximada a medianoche, llegada a las 04:30.',
      originCoords: { lat: 42.3519, lng: -71.0552 },
      destinationCoords: { lat: 40.7570, lng: -73.9902 },
      updatedAt: now,
    };

    transport.push(leg);
    events.push(leg);

    places.push({
      id: 'place-boston-south-station',
      name: 'Boston South Station',
      address: '700 Atlantic Ave, Boston, MA 02110',
      lat: 42.3519,
      lng: -71.0552,
      precision: 'exacto',
      source: 'OFFICIAL',
      category: 'Transporte',
      description: 'Terminal de autobuses y trenes de Boston. Salida del autobús nocturno a Nueva York.',
    });

    places.push({
      id: 'place-ny-port-authority',
      name: 'New York Port Authority Bus Terminal',
      address: '625 8th Ave, New York, NY 10018',
      lat: 40.7570,
      lng: -73.9902,
      precision: 'exacto',
      source: 'OFFICIAL',
      category: 'Transporte',
      description: 'Terminal principal de autobuses en Manhattan. Llegada matutina desde Boston y salida a excursiones.',
    });
  });

  // 6. Parse Activities and Link with Verified Tours
  TRIP_SOURCE_DATA.actividades_y_tours.forEach((act, i) => {
    const actId = `act-${i}`;
    const verifiedBundle = VERIFIED_TOURS_DATA[actId];

    const timePrecision = act.hora && !act.hora.includes('Flexible') && !act.hora.includes('Todo')
      ? 'exacta'
      : (act.hora && act.hora.includes('Todo') ? 'todo-el-dia' : 'flexible');

    const activity: Activity = {
      id: actId,
      type: 'activity',
      title: act.actividad,
      date: act.fecha,
      localTime: act.hora || act.hora_salida || (act.hora_seguridad ? act.hora_seguridad : undefined),
      returnTime: (act as any).hora_retorno,
      provider: act.proveedor,
      status: act.estado as any,
      timePrecision,
      bookingCodes: (act as any).codigos_reserva || [],
      notes: (act as any).nota,
      meetingPoint: (act as any).punto_encuentro || verifiedBundle?.tour.meetingPoint,
      location: (act as any).ubicacion || verifiedBundle?.tour.city,
      isTour: !!verifiedBundle || !!act.proveedor,
      tourId: verifiedBundle ? verifiedBundle.tour.id : `tour-${i}`,
      coords: verifiedBundle?.tour.meetingPointCoords,
      updatedAt: now,
    };

    activities.push(activity);
    events.push(activity);

    // Register associated Tour
    if (verifiedBundle) {
      const tour = verifiedBundle.tour;
      tours.push(tour);
      tourStops.push(...verifiedBundle.stops);
      places.push(verifiedBundle.meetingPointPlace);

      // Initialize TourSession for each tour
      tourSessions.push({
        id: `session-${tour.id}`,
        tourId: tour.id,
        activityId: activity.id,
        currentStopIndex: 0,
        completedStops: [],
        status: 'NOT_STARTED',
        distanceWalked: 0,
        elapsedTime: 0,
        lastUpdated: now,
      });
    }

    // Register documents if booking codes exist
    if ((act as any).codigos_reserva) {
      (act as any).codigos_reserva.forEach((code: string) => {
        documents.push({
          id: `doc-${actId}-${code}`,
          title: `${act.actividad} (${code})`,
          category: 'TICKET',
          relatedEntityId: actId,
          availability: 'AVAILABLE_OFFLINE',
          notes: `Código de reserva: ${code}`,
          updatedAt: now,
        });
      });
    }
  });

  // 7. Parse 6 Critical Tasks
  TRIP_SOURCE_DATA.pendientes_criticos.forEach((t, i) => {
    tasks.push({
      id: `task-${i}`,
      title: t,
      status: 'PENDING',
      priority: 'CRITICO',
      updatedAt: now,
    });
  });

  // 8. Generate 18 Day Plans (Oct 12 to Oct 29)
  const tripDays = [
    { date: '2026-10-12', city: 'Cali / Viaje a Boston' },
    { date: '2026-10-13', city: 'Boston, MA' },
    { date: '2026-10-14', city: 'Boston, MA' },
    { date: '2026-10-15', city: 'Boston, MA (Autobús nocturno)' },
    { date: '2026-10-16', city: 'Nueva York, NY / Bayonne, NJ' },
    { date: '2026-10-17', city: 'Nueva York, NY' },
    { date: '2026-10-18', city: 'Nueva York, NY' },
    { date: '2026-10-19', city: 'Nueva York, NY' },
    { date: '2026-10-20', city: 'Nueva York, NY' },
    { date: '2026-10-21', city: 'Excursión a Washington D.C.' },
    { date: '2026-10-22', city: 'Nueva York / Cataratas del Niágara' },
    { date: '2026-10-23', city: 'Cataratas del Niágara, NY' },
    { date: '2026-10-24', city: 'Nueva York / Preparación vuelo a Orlando' },
    { date: '2026-10-25', city: 'Traslado a Orlando, FL (Opción 1)' },
    { date: '2026-10-26', city: 'Orlando, FL (Disney Springs)' },
    { date: '2026-10-27', city: 'Orlando, FL (Magic Kingdom)' },
    { date: '2026-10-28', city: 'Orlando, FL (Universal Studios)' },
    { date: '2026-10-29', city: 'Orlando -> Houston -> Panamá -> Cali' },
  ];

  tripDays.forEach((d) => {
    days.push({
      id: `day-${d.date}`,
      date: d.date,
      city: d.city,
    });
  });

  return {
    trip,
    travelers,
    events,
    flights,
    accommodations,
    activities,
    transport,
    tours,
    tourStops,
    tourSessions,
    tasks,
    places,
    alerts,
    documents,
    days,
  };
}
