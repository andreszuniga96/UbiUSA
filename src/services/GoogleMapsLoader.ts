import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export type GoogleMapsLifecycleState = 
  | 'NOT_CONFIGURED'
  | 'LOADING'
  | 'API_READY'
  | 'MAP_INITIALIZED'
  | 'BASEMAP_RENDERED'
  | 'ERROR';

export type MapLoaderStatus = 'IDLE' | 'NOT_CONFIGURED' | 'LOADING' | 'READY' | 'ERROR';

export interface GoogleMapsDiagnosticInfo {
  apiKeyPresent: boolean;
  mapIdPresent: boolean;
  loaderStatus: MapLoaderStatus;
  lifecycleState?: GoogleMapsLifecycleState;
  mapsApiLoaded: boolean;
  mapContainerHasSize: boolean;
  mapInitializationError: string | null;
  lastMapsAuthError: string | null;
  lastApiError: string | null;
  diagnosticDetails: string;
}

export class GoogleMapsLoader {
  private static status: MapLoaderStatus = 'IDLE';
  private static loadingPromise: Promise<void> | null = null;
  private static lastApiError: string | null = null;
  private static lastMapsAuthError: string | null = null;
  private static mapsApiLoaded: boolean = false;
  private static authListenerAttached: boolean = false;
  private static authFailureListeners: Set<(error: string) => void> = new Set();

  static onAuthFailure(listener: (error: string) => void): () => void {
    this.authFailureListeners.add(listener);
    if (this.lastMapsAuthError) {
      listener(this.lastMapsAuthError);
    }
    return () => {
      this.authFailureListeners.delete(listener);
    };
  }

  static resetForTesting(): void {
    this.status = 'IDLE';
    this.loadingPromise = null;
    this.lastApiError = null;
    this.lastMapsAuthError = null;
    this.mapsApiLoaded = false;
  }

  private static setupAuthFailureListener() {
    if (this.authListenerAttached || typeof window === 'undefined') return;
    this.authListenerAttached = true;

    // Google Maps Platform calls window.gm_authFailure when key authentication fails
    const originalAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      this.lastMapsAuthError = 'Google Maps Authentication Failure: Clave inválida, restricciones de origen (referrer) o facturación no habilitada.';
      this.status = 'ERROR';
      console.error('[GoogleMapsLoader]', this.lastMapsAuthError);
      this.authFailureListeners.forEach(listener => {
        try { listener(this.lastMapsAuthError!); } catch (err) { console.error(err); }
      });
      if (typeof originalAuthFailure === 'function') {
        originalAuthFailure();
      }
    };
  }

  static getStatus(): MapLoaderStatus {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return 'NOT_CONFIGURED';
    }
    return this.status;
  }

  static isConfigured(): boolean {
    return !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  }

  static getLifecycleState(): GoogleMapsLifecycleState {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      return 'NOT_CONFIGURED';
    }
    if (this.status === 'ERROR') return 'ERROR';
    if (this.status === 'LOADING') return 'LOADING';
    if (this.status === 'READY') return 'API_READY';
    return 'NOT_CONFIGURED';
  }

  static getDiagnosticInfo(container?: HTMLElement | null): GoogleMapsDiagnosticInfo {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

    const apiKeyPresent = !!apiKey && apiKey.trim().length > 0;
    const mapIdPresent = !!mapId && mapId.trim().length > 0;
    const mapsApiLoaded = typeof window !== 'undefined' && !!(window as any).google?.maps;
    const mapContainerHasSize = container
      ? container.clientWidth > 0 && container.clientHeight > 0
      : false;

    let details = 'Google Maps Operativo';
    if (!apiKeyPresent) {
      details = 'VITE_GOOGLE_MAPS_API_KEY ausente en el archivo .env.';
    } else if (this.lastMapsAuthError) {
      details = `Error de autenticación: ${this.lastMapsAuthError}`;
    } else if (this.lastApiError) {
      details = `Error de API: ${this.lastApiError}`;
    } else if (container && !mapContainerHasSize) {
      details = `Contenedor sin dimensiones calculadas (${container.clientWidth}x${container.clientHeight}px).`;
    } else if (this.status === 'READY') {
      details = 'API cargada y lista para renderizado.';
    } else if (this.status === 'LOADING') {
      details = 'Cargando módulos de Google Maps...';
    }

    return {
      apiKeyPresent,
      mapIdPresent,
      loaderStatus: !apiKeyPresent ? 'NOT_CONFIGURED' : this.status,
      lifecycleState: this.getLifecycleState(),
      mapsApiLoaded: mapsApiLoaded || this.mapsApiLoaded,
      mapContainerHasSize,
      mapInitializationError: this.lastApiError,
      lastMapsAuthError: this.lastMapsAuthError,
      lastApiError: this.lastApiError,
      diagnosticDetails: details,
    };
  }

  static load(): Promise<void> {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

    if (!apiKey || apiKey.trim().length === 0) {
      this.status = 'NOT_CONFIGURED';
      this.lastApiError = 'VITE_GOOGLE_MAPS_API_KEY no encontrada en variables de entorno.';
      return Promise.reject(new Error(this.lastApiError));
    }

    if (this.status === 'READY' && typeof window !== 'undefined' && (window as any).google?.maps) {
      return Promise.resolve();
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.setupAuthFailureListener();
    this.status = 'LOADING';

    try {
      setOptions({
        key: apiKey.trim(),
        v: 'weekly',
        language: 'es',
        region: 'US',
        mapIds: mapId ? [mapId.trim()] : undefined,
      });

      this.loadingPromise = (async () => {
        try {
          // Import required libraries in parallel using the modern v2 API
          await Promise.all([
            importLibrary('maps'),
            importLibrary('marker'),
            importLibrary('places'),
            importLibrary('geometry'),
          ]);

          this.mapsApiLoaded = true;
          this.status = 'READY';
          this.lastApiError = null;
        } catch (err: any) {
          this.status = 'ERROR';
          const msg = err?.message || String(err);
          this.lastApiError = `Fallo al importar bibliotecas de Google Maps: ${msg}`;
          console.error('[GoogleMapsLoader]', this.lastApiError, err);
          throw err;
        }
      })();

      return this.loadingPromise;
    } catch (err: any) {
      this.loadingPromise = null;
      return Promise.reject(err);
    }
  }
}
