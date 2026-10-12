/// <reference types="@types/google.maps" />

import { Place } from '../domain/types';
import { RouteProvider, PlaceProvider, RouteRequest, RouteResponse } from '../domain/providers';
import { GoogleMapsLoader, GoogleMapsLifecycleState } from './GoogleMapsLoader';

export interface MapMarkerConfig {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  type: string; // 'USER' | 'ACCOMMODATION' | 'MEETING_POINT' | 'TOUR_STOP' | 'ACTIVITY' | 'FOOD' | 'TRANSIT' | 'DESTINATION'
  entityId?: string;
  subtitle?: string;
  stopOrder?: number;
  clickAction?: () => void;
}

export class GoogleMapsProvider implements RouteProvider, PlaceProvider {
  private map: google.maps.Map | null = null;
  private advancedMarkers: Map<string, any> = new Map();
  private classicMarkers: Map<string, google.maps.Marker> = new Map();
  private polyline: google.maps.Polyline | null = null;
  private directionsRenderer: google.maps.DirectionsRenderer | null = null;
  private infoWindow: google.maps.InfoWindow | null = null;

  // Granular Cartography Lifecycle States
  private lifecycleState: GoogleMapsLifecycleState = 'NOT_CONFIGURED';
  private basemapRendered: boolean = false;
  private basemapError: string | null = null;
  private stateListeners: Set<(state: GoogleMapsLifecycleState) => void> = new Set();
  private listeners: google.maps.MapsEventListener[] = [];
  private authUnsubscribe: (() => void) | null = null;
  private timeoutId: any = null;

  getLifecycleState(): GoogleMapsLifecycleState {
    return this.lifecycleState;
  }

  isBasemapRendered(): boolean {
    return this.basemapRendered;
  }

  getBasemapError(): string | null {
    return this.basemapError;
  }

  onLifecycleStateChange(listener: (state: GoogleMapsLifecycleState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.lifecycleState);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private setLifecycleState(newState: GoogleMapsLifecycleState): void {
    this.lifecycleState = newState;
    this.stateListeners.forEach(listener => {
      try {
        listener(newState);
      } catch (err) {
        console.error('[GoogleMapsProvider] Error en listener de estado:', err);
      }
    });
  }

  private cleanListeners(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
    if (typeof google !== 'undefined' && google.maps?.event) {
      this.listeners.forEach(l => google.maps.event.removeListener(l));
    }
    this.listeners = [];
  }

  destroy(): void {
    this.cleanListeners();
    this.clearMarkers();
    this.clearRoute();
    if (this.infoWindow) {
      this.infoWindow.close();
      this.infoWindow = null;
    }
    this.map = null;
    this.basemapRendered = false;
  }

  async renderMap(container: HTMLElement, options?: google.maps.MapOptions): Promise<google.maps.Map> {
    if (!container) {
      throw new Error("Contenedor del mapa no disponible.");
    }

    this.cleanListeners();

    const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
    const rawMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
    const mapId = rawMapId && rawMapId.trim().length > 0 ? rawMapId.trim() : undefined;

    const baseOptions: google.maps.MapOptions = {
      zoom: 13,
      center: { lat: 40.7128, lng: -74.0060 }, // NYC default
      mapTypeId: 'roadmap',
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      ...options
    };

    const mapOptions: google.maps.MapOptions = { ...baseOptions };

    // Explicit raster rendering mode when mapId is present ensures reliable cartography
    // and eliminates vector WebGL Cloud Map Style stalling on diverse environments.
    if (mapId) {
      mapOptions.mapId = mapId;
      const renderingTypeRaster = (google.maps as any).RenderingType?.RASTER || 'RASTER';
      (mapOptions as any).renderingType = renderingTypeRaster;
    }

    this.map = new Map(container, mapOptions);
    this.setLifecycleState('MAP_INITIALIZED');

    this.infoWindow = new google.maps.InfoWindow();

    // Verificación honesta de cartografía: escuchar evento 'tilesloaded'
    let tilesDispatched = false;
    const tilesListener = this.map.addListener('tilesloaded', () => {
      if (!tilesDispatched) {
        tilesDispatched = true;
        this.basemapRendered = true;
        this.basemapError = null;
        this.setLifecycleState('BASEMAP_RENDERED');
        console.info('[GoogleMapsProvider] Cartografía confirmada: tilesloaded recibido con éxito.');
      }
    });
    this.listeners.push(tilesListener);

    // Escuchar alertas de autenticación globales
    this.authUnsubscribe = GoogleMapsLoader.onAuthFailure((errMsg) => {
      this.basemapError = errMsg;
      this.setLifecycleState('ERROR');
    });

    // Timeout de diagnóstico para reportar error honesto si no hay cartografía
    this.timeoutId = setTimeout(() => {
      if (!this.basemapRendered) {
        this.basemapError = 'Google Maps se ha inicializado, pero la cartografía no completó la descarga de mosaicos.';
        this.setLifecycleState('ERROR');
        console.error('[GoogleMapsProvider]', this.basemapError);
      }
    }, 8000);

    return this.map;
  }

  getMap(): google.maps.Map | null {
    return this.map;
  }

  setCenter(lat: number, lng: number): void {
    if (this.map && !isNaN(lat) && !isNaN(lng)) {
      this.map.setCenter({ lat, lng });
    }
  }

  setZoom(zoom: number): void {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  fitBounds(bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral): void {
    if (this.map) {
      this.map.fitBounds(bounds);
    }
  }

  fitToMarkers(): void {
    if (!this.map) return;
    const bounds = new google.maps.LatLngBounds();
    let count = 0;

    this.advancedMarkers.forEach(m => {
      if (m.position) {
        bounds.extend(m.position);
        count++;
      }
    });

    this.classicMarkers.forEach(m => {
      const pos = m.getPosition();
      if (pos) {
        bounds.extend(pos);
        count++;
      }
    });

    if (count > 0) {
      this.map.fitBounds(bounds);
      // Don't zoom in too much if single marker
      if (count === 1) {
        this.map.setZoom(15);
      }
    }
  }

  private createMarkerElement(config: MapMarkerConfig): HTMLElement {
    const el = document.createElement('div');
    el.className = 'ubi-map-marker';
    el.style.cursor = 'pointer';

    let bg = '#4f46e5';
    let label = '📍';
    let ringColor = 'rgba(79, 70, 229, 0.3)';

    switch (config.type) {
      case 'USER':
        bg = '#2563eb';
        label = '🚶';
        ringColor = 'rgba(37, 99, 235, 0.4)';
        break;
      case 'ACCOMMODATION':
        bg = '#059669';
        label = '🏠';
        ringColor = 'rgba(5, 150, 105, 0.3)';
        break;
      case 'MEETING_POINT':
        bg = '#7c3aed';
        label = '🚩';
        ringColor = 'rgba(124, 58, 237, 0.3)';
        break;
      case 'TOUR_STOP':
        bg = '#4338ca';
        label = config.stopOrder ? `${config.stopOrder}` : '🎯';
        ringColor = 'rgba(67, 56, 202, 0.3)';
        break;
      case 'ACTIVITY':
        bg = '#d97706';
        label = '⭐';
        ringColor = 'rgba(217, 119, 6, 0.3)';
        break;
      case 'FOOD':
      case 'RESTAURANT':
        bg = '#e11d48';
        label = '🍴';
        ringColor = 'rgba(225, 29, 72, 0.3)';
        break;
      case 'TRANSIT':
        bg = '#0284c7';
        label = '🚆';
        ringColor = 'rgba(2, 132, 199, 0.3)';
        break;
    }

    el.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        background: ${bg};
        color: white;
        border-radius: 50%;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 4px 10px ${ringColor}, 0 2px 4px rgba(0,0,0,0.2);
        border: 2px solid #ffffff;
        transition: transform 0.2s ease;
      ">
        ${label}
      </div>
    `;

    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.15)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1.0)';
    });

    return el;
  }

  getMarkerColor(type: string): string {
    switch (type) {
      case 'USER': return '#2563eb';
      case 'ACCOMMODATION': return '#059669';
      case 'MEETING_POINT': return '#7c3aed';
      case 'TOUR_STOP': return '#4338ca';
      case 'ACTIVITY': return '#d97706';
      case 'FOOD':
      case 'RESTAURANT': return '#e11d48';
      case 'TRANSIT': return '#0284c7';
      default: return '#4f46e5';
    }
  }

  async addMarker(config: MapMarkerConfig): Promise<void> {
    if (!this.map) return;
    this.removeMarker(config.id);

    try {
      // Try modern AdvancedMarkerElement
      const markerLib = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      if (markerLib?.AdvancedMarkerElement) {
        const markerElement = this.createMarkerElement(config);
        const marker = new markerLib.AdvancedMarkerElement({
          map: this.map,
          position: config.position,
          title: config.title,
          content: markerElement,
        });

        const clickHandler = () => {
          if (config.clickAction) {
            config.clickAction();
          } else if (this.infoWindow) {
            this.infoWindow.setContent(`
              <div style="padding: 6px 10px; font-family: system-ui, sans-serif;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #111827;">${config.title}</h4>
                ${config.subtitle ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">${config.subtitle}</p>` : ''}
              </div>
            `);
            this.infoWindow.open({
              anchor: marker,
              map: this.map,
            });
          }
        };

        marker.addListener('click', clickHandler);
        this.advancedMarkers.set(config.id, marker);
        return;
      }
    } catch {
      // Fall through to classic Marker if AdvancedMarker is unavailable or mapId unsupported
    }

    // Classic Marker Fallback con pines coloreados por tipo y soporte de InfoWindow
    const pinColor = this.getMarkerColor(config.type);
    const classicMarker = new google.maps.Marker({
      position: config.position,
      map: this.map,
      title: config.title,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: pinColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2.5,
      },
    });

    const classicClickHandler = () => {
      if (config.clickAction) {
        config.clickAction();
      } else if (this.infoWindow) {
        this.infoWindow.setContent(`
          <div style="padding: 6px 10px; font-family: system-ui, sans-serif;">
            <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #111827;">${config.title}</h4>
            ${config.subtitle ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">${config.subtitle}</p>` : ''}
          </div>
        `);
        this.infoWindow.open({
          anchor: classicMarker,
          map: this.map,
        });
      }
    };

    classicMarker.addListener('click', classicClickHandler);
    this.classicMarkers.set(config.id, classicMarker);
  }

  removeMarker(id: string): void {
    const adv = this.advancedMarkers.get(id);
    if (adv) {
      adv.map = null;
      this.advancedMarkers.delete(id);
    }
    const classic = this.classicMarkers.get(id);
    if (classic) {
      classic.setMap(null);
      this.classicMarkers.delete(id);
    }
  }

  clearMarkers(): void {
    this.advancedMarkers.forEach(m => { m.map = null; });
    this.advancedMarkers.clear();
    this.classicMarkers.forEach(m => { m.setMap(null); });
    this.classicMarkers.clear();
    if (this.infoWindow) {
      this.infoWindow.close();
    }
  }

  drawRoute(path: { lat: number; lng: number }[], color: string = '#4f46e5'): void {
    this.clearRoute();
    if (!this.map || path.length < 2) return;

    this.polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.9,
      strokeWeight: 5,
      map: this.map
    });
  }

  clearRoute(): void {
    if (this.polyline) {
      this.polyline.setMap(null);
      this.polyline = null;
    }
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
      this.directionsRenderer = null;
    }
  }

  async calculateAndDrawRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    travelMode: google.maps.TravelMode | string = 'WALKING'
  ): Promise<google.maps.DirectionsResult | null> {
    if (!this.map) return null;
    this.clearRoute();

    let mode: google.maps.TravelMode = google.maps.TravelMode.WALKING;
    const modeStr = String(travelMode).toUpperCase();
    if (modeStr === 'DRIVE' || modeStr === 'DRIVING') {
      mode = google.maps.TravelMode.DRIVING;
    } else if (modeStr === 'TRANSIT') {
      mode = google.maps.TravelMode.TRANSIT;
    }

    const directionsService = new google.maps.DirectionsService();

    if (!this.directionsRenderer) {
      this.directionsRenderer = new google.maps.DirectionsRenderer({
        map: this.map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#4f46e5',
          strokeWeight: 5,
        }
      });
    }

    return new Promise((resolve) => {
      directionsService.route({
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: mode,
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          this.directionsRenderer?.setDirections(result);
          resolve(result);
        } else {
          console.warn('[GoogleMapsProvider] Directions request failed:', status);
          // Fallback straight polyline
          this.drawRoute([origin, destination]);
          resolve(null);
        }
      });
    });
  }

  // --- RouteProvider implementation ---
  async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    const directionsService = new google.maps.DirectionsService();
    const geometryLib = await google.maps.importLibrary("geometry") as google.maps.GeometryLibrary;

    let mode = google.maps.TravelMode.WALKING;
    if (request.travelMode === 'DRIVE') mode = google.maps.TravelMode.DRIVING;
    if (request.travelMode === 'TRANSIT') mode = google.maps.TravelMode.TRANSIT;

    return new Promise((resolve) => {
      directionsService.route({
        origin: new google.maps.LatLng(request.origin.lat, request.origin.lng),
        destination: new google.maps.LatLng(request.destination.lat, request.destination.lng),
        travelMode: mode,
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result && result.routes.length > 0) {
          const route = result.routes[0];
          const leg = route.legs[0];
          const encoded = route.overview_polyline;

          const distanceMeters = leg?.distance?.value || 0;
          const durationSeconds = leg?.duration?.value || 0;

          const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=600x300&path=enc:${encoded}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;

          resolve({
            distanceMeters,
            durationSeconds,
            polyline: encoded,
            staticMapUrl,
          });
        } else {
          // Geometry direct fallback
          const directDistance = geometryLib.spherical.computeDistanceBetween(
            new google.maps.LatLng(request.origin.lat, request.origin.lng),
            new google.maps.LatLng(request.destination.lat, request.destination.lng)
          );
          resolve({
            distanceMeters: Math.round(directDistance),
            durationSeconds: Math.round(directDistance / 1.3), // approx 1.3 m/s walking speed
            polyline: '',
          });
        }
      });
    });
  }

  // --- PlaceProvider implementation ---
  async searchPlace(query: string): Promise<Place[]> {
    try {
      const placesLib = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      
      if ((placesLib as any)?.Place?.searchByText) {
        const { places } = await (placesLib as any).Place.searchByText({
          textQuery: query,
          fields: ['id', 'displayName', 'location', 'formattedAddress']
        });

        if (places && Array.isArray(places)) {
          return places.map((p: any) => ({
            id: p.id || Math.random().toString(),
            name: typeof p.displayName === 'string' ? p.displayName : p.displayName?.text || '',
            address: p.formattedAddress || undefined,
            lat: typeof p.location?.lat === 'function' ? p.location.lat() : p.location?.lat || 0,
            lng: typeof p.location?.lng === 'function' ? p.location.lng() : p.location?.lng || 0,
            precision: 'exacto',
            source: 'google',
          }));
        }
      }
    } catch (err) {
      console.warn('[GoogleMapsProvider] Places searchByText failed, attempting PlacesService fallback', err);
    }

    // Classic PlacesService fallback
    return new Promise((resolve) => {
      if (!this.map) return resolve([]);
      const service = new google.maps.places.PlacesService(this.map);
      service.textSearch({ query }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results.map(r => ({
            id: r.place_id || Math.random().toString(),
            name: r.name || '',
            address: r.formatted_address,
            lat: r.geometry?.location?.lat() || 0,
            lng: r.geometry?.location?.lng() || 0,
            precision: 'exacto',
            source: 'google'
          })));
        } else {
          resolve([]);
        }
      });
    });
  }

  async searchNearby(location: { lat: number; lng: number }, radiusMeters: number = 1000, type?: string): Promise<Place[]> {
    try {
      const placesLib = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      if ((placesLib as any)?.Place?.searchNearby) {
        const { places } = await (placesLib as any).Place.searchNearby({
          locationRestriction: {
            center: { lat: location.lat, lng: location.lng },
            radius: radiusMeters,
          },
          includedTypes: type ? [type] : undefined,
          fields: ['id', 'displayName', 'location', 'formattedAddress', 'rating', 'priceLevel'],
        });

        if (places && Array.isArray(places)) {
          return places.map((p: any) => ({
            id: p.id || Math.random().toString(),
            name: typeof p.displayName === 'string' ? p.displayName : p.displayName?.text || '',
            address: p.formattedAddress || undefined,
            lat: typeof p.location?.lat === 'function' ? p.location.lat() : p.location?.lat || 0,
            lng: typeof p.location?.lng === 'function' ? p.location.lng() : p.location?.lng || 0,
            precision: 'exacto',
            source: 'google',
          }));
        }
      }
    } catch (err) {
      console.warn('[GoogleMapsProvider] Places searchNearby failed, trying fallback', err);
    }

    // Classic nearbySearch fallback
    return new Promise((resolve) => {
      if (!this.map) return resolve([]);
      const service = new google.maps.places.PlacesService(this.map);
      service.nearbySearch({
        location: new google.maps.LatLng(location.lat, location.lng),
        radius: radiusMeters,
        type: type as any,
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results.map(r => ({
            id: r.place_id || Math.random().toString(),
            name: r.name || '',
            address: r.vicinity,
            lat: r.geometry?.location?.lat() || 0,
            lng: r.geometry?.location?.lng() || 0,
            precision: 'exacto',
            source: 'google'
          })));
        } else {
          resolve([]);
        }
      });
    });
  }

  async getPlaceDetails(placeId: string): Promise<Place> {
    try {
      const placesLib = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      if ((placesLib as any)?.Place) {
        const place = new (placesLib as any).Place({ id: placeId });
        await place.fetchFields({
          fields: ['id', 'displayName', 'location', 'formattedAddress']
        });

        return {
          id: place.id || placeId,
          name: typeof place.displayName === 'string' ? place.displayName : place.displayName?.text || '',
          address: place.formattedAddress || undefined,
          lat: typeof place.location?.lat === 'function' ? place.location.lat() : place.location?.lat || 0,
          lng: typeof place.location?.lng === 'function' ? place.location.lng() : place.location?.lng || 0,
          precision: 'exacto',
          source: 'google'
        };
      }
    } catch (err) {
      console.warn('[GoogleMapsProvider] Place getPlaceDetails failed, fallback to basic Place', err);
    }

    return {
      id: placeId,
      name: 'Lugar seleccionado',
      lat: 0,
      lng: 0,
      precision: 'exacto',
      source: 'google'
    };
  }
}
