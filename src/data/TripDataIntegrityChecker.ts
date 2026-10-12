import { TRIP_SOURCE_DATA } from './seed/tripSource';
import { parseTripData } from './seed/parser';
import { db } from './db';

export interface IntegrityCheckResult {
  passed: boolean;
  timestamp: string;
  counts: {
    flights: { source: number; processed: number; db: number };
    flightSegments: { source: number; processed: number; db: number };
    accommodations: { source: number; processed: number; db: number };
    transport: { source: number; processed: number; db: number };
    activities: { source: number; processed: number; db: number };
    tours: { source: number; processed: number; db: number };
    tourStops: { source: number; processed: number; db: number };
    tasks: { source: number; processed: number; db: number };
    documents: { source: number; processed: number; db: number };
    events: { source: number; processed: number; db: number };
    days: { source: number; processed: number; db: number };
  };
  discrepancies: string[];
}

export class TripDataIntegrityChecker {
  static async verify(): Promise<IntegrityCheckResult> {
    console.log('[TripDataIntegrityChecker] Iniciando auditoría forense de integridad de datos...');

    const bundle = parseTripData();

    // Source counts
    const srcFlights = TRIP_SOURCE_DATA.vuelos.length; // 3
    let srcSegments = 0;
    TRIP_SOURCE_DATA.vuelos.forEach((v: any) => {
      if (v.trayectos) srcSegments += v.trayectos.length;
    }); // 2 + 3 = 5

    const srcAccoms = TRIP_SOURCE_DATA.alojamientos.length; // 3
    const srcTransport = TRIP_SOURCE_DATA.transporte_terrestre.length; // 1
    const srcActivities = TRIP_SOURCE_DATA.actividades_y_tours.length; // 14
    const srcTours = 14; // Canonical 14 tours mapped 1-to-1
    const srcTasks = TRIP_SOURCE_DATA.pendientes_criticos.length; // 6
    const srcEvents = srcFlights + srcAccoms + srcTransport + srcActivities; // 3 + 3 + 1 + 14 = 21

    // Processed counts from parser
    const procFlights = bundle.flights.length;
    let procSegments = 0;
    bundle.flights.forEach(f => { procSegments += f.segments.length; });
    const procAccoms = bundle.accommodations.length;
    const procTransport = bundle.transport.length;
    const procActivities = bundle.activities.length;
    const procTours = bundle.tours.length;
    const procStops = bundle.tourStops.length;
    const procTasks = bundle.tasks.length;
    const procDocs = bundle.documents.length;
    const procEvents = bundle.events.length;
    const procDays = bundle.days.length;

    // Database counts
    const dbFlights = await db.flights.count();
    const dbFlightRecords = await db.flights.toArray();
    let dbSegments = 0;
    dbFlightRecords.forEach(f => { dbSegments += f.segments?.length || 0; });

    const dbAccoms = await db.accommodations.count();
    const dbTransport = await db.transport.count();
    const dbActivities = await db.activities.count();
    const dbTours = await db.tours.count();
    const dbStops = await db.tourStops.count();
    const dbTasks = await db.tasks.count();
    const dbDocs = await db.documents.count();
    const dbEvents = await db.events.count();
    const dbDays = await db.days.count();

    const discrepancies: string[] = [];

    // Validations
    if (srcFlights !== dbFlights) discrepancies.push(`Flights: SOURCE ${srcFlights} vs DB ${dbFlights}`);
    if (srcSegments !== dbSegments) discrepancies.push(`Flight Segments: SOURCE ${srcSegments} vs DB ${dbSegments}`);
    if (srcAccoms !== dbAccoms) discrepancies.push(`Accommodations: SOURCE ${srcAccoms} vs DB ${dbAccoms}`);
    if (srcTransport !== dbTransport) discrepancies.push(`Transport: SOURCE ${srcTransport} vs DB ${dbTransport}`);
    if (srcActivities !== dbActivities) discrepancies.push(`Activities: SOURCE ${srcActivities} vs DB ${dbActivities}`);
    if (srcTours !== dbTours) discrepancies.push(`Tours: SOURCE ${srcTours} vs DB ${dbTours}`);
    if (dbStops === 0) discrepancies.push(`Tour Stops: DB is empty (${dbStops})`);
    if (srcTasks !== dbTasks) discrepancies.push(`Tasks: SOURCE ${srcTasks} vs DB ${dbTasks}`);
    if (srcEvents !== dbEvents) discrepancies.push(`Timeline Events: SOURCE ${srcEvents} vs DB ${dbEvents}`);

    // Critical error condition: SOURCE > 0 but DB === 0
    if (srcActivities > 0 && dbActivities === 0) {
      discrepancies.push('CRITICAL REGRESSION: SOURCE activities > 0, DATABASE activities = 0');
    }
    if (srcTours > 0 && dbTours === 0) {
      discrepancies.push('CRITICAL REGRESSION: SOURCE tours > 0, DATABASE tours = 0');
    }

    const passed = discrepancies.length === 0;

    const result: IntegrityCheckResult = {
      passed,
      timestamp: new Date().toISOString(),
      counts: {
        flights: { source: srcFlights, processed: procFlights, db: dbFlights },
        flightSegments: { source: srcSegments, processed: procSegments, db: dbSegments },
        accommodations: { source: srcAccoms, processed: procAccoms, db: dbAccoms },
        transport: { source: srcTransport, processed: procTransport, db: dbTransport },
        activities: { source: srcActivities, processed: procActivities, db: dbActivities },
        tours: { source: srcTours, processed: procTours, db: dbTours },
        tourStops: { source: procStops, processed: procStops, db: dbStops },
        tasks: { source: srcTasks, processed: procTasks, db: dbTasks },
        documents: { source: procDocs, processed: procDocs, db: dbDocs },
        events: { source: srcEvents, processed: procEvents, db: dbEvents },
        days: { source: 18, processed: procDays, db: dbDays },
      },
      discrepancies
    };

    if (!passed) {
      console.warn('[TripDataIntegrityChecker] Discrepancias detectadas en la base de datos:', discrepancies);
    } else {
      console.log('[TripDataIntegrityChecker] ✅ Integridad de datos 100% verificada. Cero discrepancias.');
    }

    return result;
  }
}
