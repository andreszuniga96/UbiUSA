// src/domain/types.ts

export type ID = string;

export interface Traveler {
  id: ID;
  name: string;
  preferences?: {
    budgetLevel: 'LOW' | 'MEDIUM' | 'PREMIUM';
    foodBudgetPerPerson?: number;
    transportBudgetPerDay?: number;
  };
}

export interface Trip {
  id: ID;
  title: string;
  startDate: string;
  endDate: string;
  ownerUid?: string;
  memberEmails: string[];
  dataVersion: number;
}

export type TimePrecision = 'exacta' | 'aproximada' | 'flexible' | 'todo-el-dia' | 'desconocida';

export interface TripEventBase {
  id: ID;
  date: string; // YYYY-MM-DD
  localTime?: string; // HH:mm
  timeZone?: string; // IANA timezone e.g. America/New_York
  utc?: string; // ISO 8601
  timePrecision: TimePrecision;
  status: 'confirmado' | 'planificado' | 'pendiente' | 'aproximado' | 'cancelado' | 'realizado' | 'en-curso' | 'retrasado' | 'pendiente_compra' | 'pendiente_reserva';
  notes?: string;
  updatedAt: number;
  updatedBy?: string;
  deleted?: boolean;
}

export interface FlightSegment {
  flightNumber?: string;
  origin: string; // Code or Place ID
  destination: string;
  departureTime?: string;
  arrivalTime?: string;
}

export interface Flight extends TripEventBase {
  type: 'flight';
  flightType: 'ida' | 'regreso' | 'interno';
  airline: string;
  bookingCodes: string[];
  segments: FlightSegment[];
}

export interface Accommodation extends TripEventBase {
  type: 'accommodation';
  city: string;
  platform: string;
  host?: string;
  checkIn: string;
  checkOut: string;
  placeId?: ID; // Reference to Place
  bookingCodes?: string[];
}

export interface Activity extends TripEventBase {
  type: 'activity';
  title: string;
  city?: string;
  provider?: string;
  bookingCodes?: string[];
  placeId?: ID;
  meetingPointPlaceId?: ID;
  meetingPoint?: string;
  location?: string;
  tourId?: ID;
  isTour?: boolean;
  returnTime?: string;
  coords?: { lat: number; lng: number };
}

export interface TransportLeg extends TripEventBase {
  type: 'transport';
  transportType: 'bus' | 'train' | 'ferry' | 'car';
  origin: string;
  destination: string;
  departureTime?: string;
  departureTimeNormalized?: string;
  arrivalTime?: string;
  arrivalDate?: string;
  bookingCodes?: string[];
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
}

export interface Tour extends TripEventBase {
  type: 'tour';
  title: string;
  city: string;
  activityId?: ID;
  meetingPointPlaceId?: ID;
  meetingPoint?: string;
  meetingPointAddress?: string;
  meetingPointCoords?: { lat: number; lng: number };
  bookingCodes?: string[];
  provider?: string;
  durationMinutes?: number;
  distanceKm?: number;
  verificationStatus?: 'VERIFIED' | 'LOCATION_REQUIRES_VERIFICATION' | 'CONTENT_UNVERIFIED';
  source?: 'OFFICIAL' | 'GURUWALK' | 'GOOGLE' | 'OPEN_DATA' | 'CURATED' | 'USER' | 'ESTIMATED';
  stopsCount?: number;
  overview?: string;
}

export interface TourStop {
  id: ID;
  tourId: ID;
  order: number;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  description?: string;
  history?: string;
  whyItMatters?: string;
  whatToSee?: string[];
  funFact?: string;
  photoTip?: string;
  estimatedVisitTime?: number; // minutes
  nearbyFood?: string[];
  nearbyCoffee?: string[];
  nearbyServices?: string[];
  nextStopId?: ID;
  source: 'OFFICIAL' | 'GURUWALK' | 'GOOGLE' | 'OPEN_DATA' | 'CURATED' | 'USER' | 'ESTIMATED';
  verificationStatus?: 'VERIFIED' | 'LOCATION_REQUIRES_VERIFICATION' | 'CONTENT_UNVERIFIED';
  sourceUrl?: string;
  verifiedAt?: number;
}

export interface TourSession {
  id: ID;
  tourId?: ID;
  activityId: ID;
  startedAt?: number;
  currentStopIndex: number;
  completedStops: ID[];
  currentLocation?: { lat: number; lng: number };
  distanceWalked?: number;
  elapsedTime?: number;
  status: 'NOT_STARTED' | 'NAVIGATING_TO_MEETING_POINT' | 'WAITING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  lastUpdated?: number;
}

export interface Task {
  id: ID;
  title: string;
  description?: string;
  priority: 'CRITICO' | 'IMPORTANTE' | 'NORMAL';
  status: 'PENDING' | 'DONE';
  dueDate?: string;
  relatedEntityId?: ID;
  updatedAt: number;
  updatedBy?: string;
  deleted?: boolean;
}

export interface Place {
  id: ID;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  precision: 'exacto' | 'ciudad';
  source: 'user' | 'osm' | 'google' | 'OFFICIAL' | 'GURUWALK' | 'OPEN_DATA' | 'CURATED' | 'ESTIMATED';
  verifiedAt?: number;
  attribution?: string;
  category?: string;
  imageUrl?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  description?: string;
  history?: string;
  highlights?: string[];
  funFact?: string;
  photoTip?: string;
  rating?: number;
  priceLevel?: string;
  nearbyFood?: string[];
  nearbyCoffee?: string[];
  nearbyServices?: string[];
  transitInfo?: string;
}

export interface Recommendation {
  id: ID;
  title: string;
  category: string;
  reason: string;
  placeId?: ID;
  distance?: number; // meters
}

export interface RestaurantRecommendation extends Recommendation {
  category: 'FOOD';
  priceLevel: '💰 ECONÓMICO' | '💰💰 BUEN COSTO-BENEFICIO' | '💰💰💰 MODERADO' | '💰💰💰💰 EXPERIENCIA';
  foodCategory: 'Desayuno' | 'Almuerzo' | 'Cena' | 'Snack' | 'Café' | 'Postre' | 'Comida rápida';
  valueScore: number;
  quality?: number;
}

export interface RoutePlan {
  id: ID;
  name?: string;
  originPlaceId: ID;
  destinationPlaceId: ID;
}

export interface TransitPlan {
  id: ID;
  routePlanId: ID;
  transportType: '🚶 WALK' | '🚇 SUBWAY' | '🚌 BUS' | '🚆 TRAIN' | '⛴ FERRY' | '🚕 TAXI / RIDESHARE';
  durationMin: number;
  transfers: number;
  costEstimate?: string;
  isFaster: boolean;
  source: 'STATIC' | 'REAL_TIME';
}

export interface Document {
  id: ID;
  title: string;
  category: 'PDF' | 'IMAGE' | 'TICKET' | 'CONFIRMATION' | 'CODE' | 'ADDRESS' | 'NOTE';
  relatedEntityId?: ID;
  availability: 'AVAILABLE_OFFLINE' | 'ONLINE_ONLY' | 'MISSING';
  fileBlobId?: string;
  notes?: string;
  updatedAt: number;
  deleted?: boolean;
}

export interface TravelAlert {
  id: ID;
  type: 'SAFE' | 'WATCH' | 'RISK' | 'CRITICAL';
  message: string;
  relatedEntityId?: ID;
  createdAt: number;
}

export interface WeatherSnapshot {
  id: ID;
  city: string;
  date: string;
  temperature: number;
  rainProb: number;
  windSpeed: number;
  feelsLike: number;
  alerts?: string[];
  updatedAt: number;
}

export interface OfflineManifest {
  id: ID;
  createdAt: number;
  updatedAt: number;
  version: string;
  sizeBytes: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED';
  entitiesCount: {
    days: number;
    cities: number;
    events: number;
    documents: number;
  };
}

export interface DayPlan {
  id: ID;
  date: string;
  city: string;
  weatherSnapshotId?: ID;
}

// Union of timeline events
export type TimelineEvent = Flight | Accommodation | Activity | TransportLeg | Tour;
