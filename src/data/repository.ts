import { db } from './db';
import { parseTripData, ParsedTripBundle } from './seed/parser';
import { 
  TimelineEvent, Task, Flight, Accommodation, Activity, TransportLeg, 
  Tour, TourStop, TourSession, Place, TravelAlert, Document, DayPlan 
} from '../domain/types';
import { TripDataIntegrityChecker } from './TripDataIntegrityChecker';

export class TripRepository {
  /**
   * Inicializa o reconcilia la base de datos local desde la fuente canónica.
   * Preserva el estado de tareas y preferencias locales del usuario.
   */
  static async seedIfEmpty(): Promise<void> {
    const metaVersion = await db.meta.get('dataVersion');
    const targetVersion = 3;

    const bundle: ParsedTripBundle = parseTripData();

    if (metaVersion && metaVersion.value === targetVersion) {
      // Check if any critical tables are missing records (forensic safety)
      const toursCount = await db.tours.count();
      const activitiesCount = await db.activities.count();
      const tasksCount = await db.tasks.count();

      if (toursCount > 0 && activitiesCount > 0 && tasksCount === 6) {
        console.log('[TripRepository] DB ya inicializada y verificada (v' + metaVersion.value + ')');
        await TripDataIntegrityChecker.verify();
        return;
      }
    }

    console.log('[TripRepository] Sembrando o reconciliando IndexedDB desde la fuente canónica...');

    // Fetch existing tasks to preserve user completions
    const existingTasks = await db.tasks.toArray();
    const taskStatusMap = new Map<string, 'PENDING' | 'DONE'>();
    existingTasks.forEach(t => taskStatusMap.set(t.id, t.status));

    // Fetch existing tour sessions to preserve progress
    const existingSessions = await db.tourSessions.toArray();
    const sessionMap = new Map<string, TourSession>();
    existingSessions.forEach(s => sessionMap.set(s.id, s));

    await db.transaction(
      'rw',
      [
        db.trip, db.travelers, db.events, db.flights, db.accommodations,
        db.activities, db.transport, db.tours, db.tourStops, db.tourSessions,
        db.tasks, db.places, db.alerts, db.documents, db.days, db.meta
      ],
      async () => {
        // Trip
        await db.trip.put(bundle.trip);

        // Travelers
        for (const tr of bundle.travelers) {
          await db.travelers.put(tr);
        }

        // Timeline Events
        for (const ev of bundle.events) {
          await db.events.put(ev);
        }

        // Flights
        for (const fl of bundle.flights) {
          await db.flights.put(fl);
        }

        // Accommodations
        for (const ac of bundle.accommodations) {
          await db.accommodations.put(ac);
        }

        // Transport
        for (const tr of bundle.transport) {
          await db.transport.put(tr);
        }

        // Activities
        for (const act of bundle.activities) {
          await db.activities.put(act);
        }

        // Tours & Stops
        for (const tour of bundle.tours) {
          await db.tours.put(tour);
        }
        for (const stop of bundle.tourStops) {
          await db.tourStops.put(stop);
        }

        // Tour Sessions (preserve user progress if exists)
        for (const session of bundle.tourSessions) {
          const existing = sessionMap.get(session.id);
          if (existing) {
            await db.tourSessions.put(existing);
          } else {
            await db.tourSessions.put(session);
          }
        }

        // Tasks (preserve user DONE status)
        for (const task of bundle.tasks) {
          const userStatus = taskStatusMap.get(task.id);
          await db.tasks.put({
            ...task,
            status: userStatus || task.status,
          });
        }

        // Places
        for (const place of bundle.places) {
          await db.places.put(place);
        }

        // Alerts
        for (const alert of bundle.alerts) {
          await db.alerts.put(alert);
        }

        // Documents
        for (const doc of bundle.documents) {
          await db.documents.put(doc);
        }

        // Days
        for (const day of bundle.days) {
          await db.days.put(day);
        }

        await db.meta.put({ key: 'dataVersion', value: targetVersion });
      }
    );

    console.log('[TripRepository] Siembra canónica completada exitosamente.');
    await TripDataIntegrityChecker.verify();
  }

  static async getEvents(): Promise<TimelineEvent[]> {
    const records = await db.events.toArray();
    return records.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      const timeA = a.localTime || '00:00';
      const timeB = b.localTime || '00:00';
      return timeA.localeCompare(timeB);
    });
  }

  static async getActivities(): Promise<Activity[]> {
    return await db.activities.toArray();
  }

  static async getFlights(): Promise<Flight[]> {
    return await db.flights.toArray();
  }

  static async getAccommodations(): Promise<Accommodation[]> {
    return await db.accommodations.toArray();
  }

  static async getTransport(): Promise<TransportLeg[]> {
    return await db.transport.toArray();
  }

  static async getTours(): Promise<Tour[]> {
    return await db.tours.toArray();
  }

  static async getTourById(tourId: string): Promise<Tour | undefined> {
    return await db.tours.get(tourId);
  }

  static async getTourByActivityId(activityId: string): Promise<Tour | undefined> {
    return await db.tours.where('activityId').equals(activityId).first();
  }

  static async getTourStops(tourId: string): Promise<TourStop[]> {
    const stops = await db.tourStops.where('tourId').equals(tourId).toArray();
    return stops.sort((a, b) => a.order - b.order);
  }

  static async getTourSession(tourId: string): Promise<TourSession | undefined> {
    const session = await db.tourSessions.get(`session-${tourId}`);
    if (session) return session;
    return await db.tourSessions.where('tourId').equals(tourId).first();
  }

  static async saveTourSession(session: TourSession): Promise<void> {
    await db.tourSessions.put({
      ...session,
      lastUpdated: Date.now(),
    });
  }

  static async getTasks(): Promise<Task[]> {
    return await db.tasks.toArray();
  }

  static async updateTaskStatus(taskId: string, status: 'PENDING' | 'DONE'): Promise<void> {
    const record = await db.tasks.get(taskId);
    if (!record) throw new Error('Task not found');

    const updatedTask = { ...record, status, updatedAt: Date.now() };

    await db.transaction('rw', [db.tasks, db.syncQueue], async () => {
      await db.tasks.put(updatedTask);

      await db.syncQueue.add({
        collection: 'tasks',
        docId: taskId,
        operation: 'update',
        payload: { status, updatedAt: updatedTask.updatedAt },
        status: 'PENDING',
        timestamp: Date.now()
      });
    });
  }

  static async getPlaces(): Promise<Place[]> {
    return await db.places.toArray();
  }

  static async getAlerts(): Promise<TravelAlert[]> {
    return await db.alerts.toArray();
  }

  static async getDocuments(): Promise<Document[]> {
    return await db.documents.toArray();
  }

  static async getDays(): Promise<DayPlan[]> {
    const days = await db.days.toArray();
    return days.sort((a, b) => a.date.localeCompare(b.date));
  }
}
