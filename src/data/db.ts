import Dexie, { Table } from 'dexie';
import { 
  Trip, Traveler, DayPlan, TimelineEvent, Flight, Accommodation, Activity, TransportLeg, Tour,
  TourStop, TourSession, Place, Recommendation, RoutePlan, TransitPlan, Document, Task, 
  TravelAlert, WeatherSnapshot, OfflineManifest 
} from '../domain/types';

export interface OutboxRecord {
  id?: number;
  collection: string;
  docId: string;
  operation: 'set' | 'update' | 'delete';
  payload: any;
  status: 'PENDING' | 'SYNCING' | 'ERROR';
  error?: string;
  timestamp: number;
}

export interface MetaRecord {
  key: string;
  value: any;
}

export class TripDatabase extends Dexie {
  trip!: Table<Trip, string>;
  travelers!: Table<Traveler, string>;
  days!: Table<DayPlan, string>;
  events!: Table<TimelineEvent, string>; // Generic events if needed, but specific below
  flights!: Table<Flight, string>;
  accommodations!: Table<Accommodation, string>;
  activities!: Table<Activity, string>;
  transport!: Table<TransportLeg, string>;
  tours!: Table<Tour, string>;
  tourStops!: Table<TourStop, string>;
  tourSessions!: Table<TourSession, string>;
  places!: Table<Place, string>;
  recommendations!: Table<Recommendation, string>;
  routes!: Table<RoutePlan, string>;
  transit!: Table<TransitPlan, string>;
  documents!: Table<Document, string>;
  tasks!: Table<Task, string>;
  alerts!: Table<TravelAlert, string>;
  weather!: Table<WeatherSnapshot, string>;
  offlineManifest!: Table<OfflineManifest, string>;
  syncQueue!: Table<OutboxRecord, number>;
  meta!: Table<MetaRecord, string>;

  constructor() {
    super('usa_trip_companion');
    this.version(2).stores({
      trip: 'id',
      travelers: 'id',
      days: 'id, date',
      events: 'id, date, type',
      flights: 'id, date',
      accommodations: 'id, date',
      activities: 'id, date',
      transport: 'id, date',
      tours: 'id, date',
      tourStops: 'id, tourId, order',
      tourSessions: 'id, activityId, status',
      places: 'id',
      recommendations: 'id, category',
      routes: 'id',
      transit: 'id, routePlanId',
      documents: 'id, relatedEntityId, category',
      tasks: 'id, status, priority, relatedEntityId',
      alerts: 'id, relatedEntityId, type',
      weather: 'id, city, date',
      offlineManifest: 'id',
      syncQueue: '++id, status, timestamp, collection',
      meta: 'key',
    });

    this.version(3).stores({
      activities: 'id, date, tourId',
      tours: 'id, date, activityId',
      tourSessions: 'id, tourId, activityId, status',
      places: 'id, category',
    });
  }
}

export const db = new TripDatabase();
