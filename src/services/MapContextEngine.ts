import { TimelineEvent, Tour, TourStop, Place } from '../domain/types';
import { MapMarkerConfig } from './GoogleMapsProvider';
import { VERIFIED_TOURS_DATA } from '../data/seed/verifiedToursData';

export interface MapViewport {
  center: { lat: number; lng: number };
  zoom: number;
}

export interface MapContextOutput {
  viewport: MapViewport;
  markers: MapMarkerConfig[];
  routes?: { lat: number; lng: number }[];
  activeLayers: string[];
  selectedPlace?: Place | null;
}

export interface MapContextInput {
  currentDate?: string;
  currentCity?: string;
  currentLocation?: { lat: number; lng: number } | null;
  selectedEvent?: TimelineEvent | null;
  selectedTourId?: string | null;
  dayEvents?: TimelineEvent[];
  allTours?: Tour[];
  allStops?: TourStop[];
  allPlaces?: Place[];
  activeCategoryFilter?: string; // 'ALL' | 'TOURS' | 'ACCOMMODATION' | 'FOOD' | 'TRANSIT'
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  'boston': { lat: 42.3580, lng: -71.0600, zoom: 14 },
  'cambridge': { lat: 42.3736, lng: -71.1097, zoom: 14 },
  'new york': { lat: 40.7128, lng: -74.0060, zoom: 13 },
  'bayonne': { lat: 40.6687, lng: -74.1143, zoom: 13 },
  'brooklyn': { lat: 40.7050, lng: -73.9700, zoom: 13 },
  'washington': { lat: 38.8951, lng: -77.0364, zoom: 13 },
  'niagara': { lat: 43.0850, lng: -79.0680, zoom: 14 },
  'orlando': { lat: 28.4177, lng: -81.5812, zoom: 12 },
};

export class MapContextEngine {
  static evaluate(input: MapContextInput): MapContextOutput {
    const markers: MapMarkerConfig[] = [];
    let routes: { lat: number; lng: number }[] | undefined = undefined;

    let viewport: MapViewport = {
      center: { lat: 40.7128, lng: -74.0060 }, // NYC default
      zoom: 12
    };

    // User GPS location
    if (input.currentLocation && !isNaN(input.currentLocation.lat) && !isNaN(input.currentLocation.lng)) {
      markers.push({
        id: 'user-location-marker',
        position: input.currentLocation,
        title: 'Tu Ubicación Actual',
        subtitle: 'Lectura GPS del dispositivo',
        type: 'USER',
      });
      viewport.center = input.currentLocation;
      viewport.zoom = 15;
    }

    // Context from city
    if (input.currentCity) {
      const lower = input.currentCity.toLowerCase();
      for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
        if (lower.includes(key)) {
          viewport.center = { lat: coords.lat, lng: coords.lng };
          viewport.zoom = coords.zoom;
          break;
        }
      }
    }

    // Specific Tour Selected
    if (input.selectedTourId) {
      // Find verified bundle
      let bundle = Object.values(VERIFIED_TOURS_DATA).find(
        b => b.tour.id === input.selectedTourId || b.activityId === input.selectedTourId
      );

      if (bundle) {
        const meetingPos = bundle.tour.meetingPointCoords;
        if (meetingPos) {
          markers.push({
            id: `meeting-${bundle.tour.id}`,
            position: meetingPos,
            title: `Punto de Encuentro: ${bundle.tour.title}`,
            subtitle: bundle.tour.meetingPointAddress || bundle.tour.meetingPoint,
            type: 'MEETING_POINT',
            entityId: bundle.tour.id,
          });
          viewport.center = meetingPos;
          viewport.zoom = 15;
        }

        // Add tour stops
        const routePath: { lat: number; lng: number }[] = [];
        if (meetingPos) routePath.push(meetingPos);

        bundle.stops.forEach(stop => {
          markers.push({
            id: stop.id,
            position: { lat: stop.lat, lng: stop.lng },
            title: `${stop.order}. ${stop.name}`,
            subtitle: stop.address || stop.description?.slice(0, 50),
            type: 'TOUR_STOP',
            stopOrder: stop.order,
            entityId: stop.id,
          });
          routePath.push({ lat: stop.lat, lng: stop.lng });
        });

        if (routePath.length > 1) {
          routes = routePath;
        }

        return {
          viewport,
          markers,
          routes,
          activeLayers: ['TOUR_ROUTE', 'TOUR_STOPS']
        };
      }
    }

    // Day events or general overview
    const eventsToRender = input.dayEvents || [];

    eventsToRender.forEach(ev => {
      // Check if event has associated tour
      const bundle = VERIFIED_TOURS_DATA[ev.id];
      if (bundle && bundle.tour.meetingPointCoords) {
        markers.push({
          id: `marker-tour-${ev.id}`,
          position: bundle.tour.meetingPointCoords,
          title: bundle.tour.title,
          subtitle: `Punto de encuentro: ${bundle.tour.meetingPoint || ''}`,
          type: 'MEETING_POINT',
          entityId: bundle.tour.id,
        });
      } else if (ev.type === 'accommodation') {
        const accom = ev as any;
        const isCambridge = accom.city?.toLowerCase().includes('cambridge');
        const isBayonne = accom.city?.toLowerCase().includes('bayonne');
        if (isCambridge) {
          markers.push({
            id: `marker-accom-${ev.id}`,
            position: { lat: 42.3736, lng: -71.1097 },
            title: `Alojamiento: Airbnb Lynne`,
            subtitle: 'Cambridge, MA',
            type: 'ACCOMMODATION',
            entityId: ev.id,
          });
        } else if (isBayonne) {
          markers.push({
            id: `marker-accom-${ev.id}`,
            position: { lat: 40.6687, lng: -74.1143 },
            title: `Alojamiento: Airbnb Carmelo`,
            subtitle: 'Bayonne, NJ',
            type: 'ACCOMMODATION',
            entityId: ev.id,
          });
        }
      } else if (ev.type === 'transport') {
        const trans = ev as any;
        if (trans.originCoords) {
          markers.push({
            id: `trans-origin-${ev.id}`,
            position: trans.originCoords,
            title: `Salida: ${trans.origin}`,
            subtitle: trans.departureTime,
            type: 'TRANSIT',
            entityId: ev.id,
          });
        }
        if (trans.destinationCoords) {
          markers.push({
            id: `trans-dest-${ev.id}`,
            position: trans.destinationCoords,
            title: `Llegada: ${trans.destination}`,
            subtitle: trans.arrivalTime,
            type: 'TRANSIT',
            entityId: ev.id,
          });
        }
      }
    });

    // If day events center on first marker
    if (markers.length > 0 && !input.currentLocation) {
      viewport.center = markers[0].position;
      viewport.zoom = markers.length === 1 ? 15 : 13;
    }

    return {
      viewport,
      markers,
      routes,
      activeLayers: ['EVENTS']
    };
  }
}
