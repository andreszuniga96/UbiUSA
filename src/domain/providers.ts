import { Place } from './types';

export interface RouteRequest {
  origin: Place;
  destination: Place;
  travelMode: 'DRIVE' | 'TRANSIT' | 'WALK';
  departureTime?: string;
}

export interface RouteResponse {
  distanceMeters: number;
  durationSeconds: number;
  polyline: string; // encoded
  staticMapUrl?: string; // para offline visual fallback
}

export interface MapProvider {
  isOffline: boolean;
  renderMap: (center: {lat: number, lng: number}, zoom: number, markers: Place[]) => React.ReactNode;
}

export interface RouteProvider {
  calculateRoute: (request: RouteRequest) => Promise<RouteResponse>;
}

export interface PlaceProvider {
  searchPlace: (query: string) => Promise<Place[]>;
  getPlaceDetails: (placeId: string) => Promise<Place>;
}
