import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { 
  TimelineEvent, Task, Flight, Accommodation, Activity, TransportLeg, 
  Tour, TourStop, TourSession, TravelAlert, Document, DayPlan, Place 
} from '../domain/types';

export function useTimelineEvents(): TimelineEvent[] {
  return useLiveQuery(
    async () => {
      const records = await db.events.toArray();
      return records.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        const timeA = a.localTime || '00:00';
        const timeB = b.localTime || '00:00';
        return timeA.localeCompare(timeB);
      });
    },
    [],
    []
  );
}

export function useCriticalTasks(): Task[] {
  return useLiveQuery(
    async () => {
      return await db.tasks.toArray();
    },
    [],
    []
  );
}

export function useActivities(): Activity[] {
  return useLiveQuery(
    async () => {
      return await db.activities.toArray();
    },
    [],
    []
  );
}

export function useFlights(): Flight[] {
  return useLiveQuery(
    async () => {
      return await db.flights.toArray();
    },
    [],
    []
  );
}

export function useAccommodations(): Accommodation[] {
  return useLiveQuery(
    async () => {
      return await db.accommodations.toArray();
    },
    [],
    []
  );
}

export function useTransport(): TransportLeg[] {
  return useLiveQuery(
    async () => {
      return await db.transport.toArray();
    },
    [],
    []
  );
}

export function useTours(): Tour[] {
  return useLiveQuery(
    async () => {
      return await db.tours.toArray();
    },
    [],
    []
  );
}

export function useTour(tourId: string | undefined): Tour | undefined {
  return useLiveQuery(
    async () => {
      if (!tourId) return undefined;
      const byId = await db.tours.get(tourId);
      if (byId) return byId;
      return await db.tours.where('activityId').equals(tourId).first();
    },
    [tourId],
    undefined
  );
}

export function useTourStops(tourId: string | undefined): TourStop[] {
  return useLiveQuery(
    async () => {
      if (!tourId) return [];
      let stops = await db.tourStops.where('tourId').equals(tourId).toArray();
      if (stops.length === 0) {
        // Check if tourId was an activityId
        const tour = await db.tours.where('activityId').equals(tourId).first();
        if (tour) {
          stops = await db.tourStops.where('tourId').equals(tour.id).toArray();
        }
      }
      return stops.sort((a, b) => a.order - b.order);
    },
    [tourId],
    []
  );
}

export function useTourSession(tourId: string | undefined): TourSession | undefined {
  return useLiveQuery(
    async () => {
      if (!tourId) return undefined;
      const session = await db.tourSessions.get(`session-${tourId}`);
      if (session) return session;
      return await db.tourSessions.where('tourId').equals(tourId).first();
    },
    [tourId],
    undefined
  );
}

export function useTravelAlerts(): TravelAlert[] {
  return useLiveQuery(
    async () => {
      return await db.alerts.toArray();
    },
    [],
    []
  );
}

export function useDocuments(): Document[] {
  return useLiveQuery(
    async () => {
      return await db.documents.toArray();
    },
    [],
    []
  );
}

export function useDays(): DayPlan[] {
  return useLiveQuery(
    async () => {
      const records = await db.days.toArray();
      return records.sort((a, b) => a.date.localeCompare(b.date));
    },
    [],
    []
  );
}

export function usePlaces(): Place[] {
  return useLiveQuery(
    async () => {
      return await db.places.toArray();
    },
    [],
    []
  );
}
