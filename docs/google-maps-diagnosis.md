# Diagnóstico Técnico y Resolución de Causa Raíz: Google Maps Platform
**Proyecto:** UbiUSA — Travel Intelligence  
**Componente:** `GoogleMapsLoader.ts` & `GoogleMapsProvider.ts`  
**Fecha de Diagnóstico:** 11 de octubre de 2026  
**Resultado:** RESUELTO Y OPERATIVO (Estado `READY`)

---

## 1. Causa Raíz del Fallo Inicial
Al inspeccionar los registros de la consola del navegador en tiempo de ejecución, se identificaron **tres causas concurrentes** que bloqueaban por completo el mapa interactivo:

### Causa 1: Incompatibilidad de versión en `@googlemaps/js-api-loader` v2.1.3
- **Error emitido por la librería:**
  ```text
  Uncaught (in promise) Error: The Loader class is no longer available in this version.
  Please use the new functional API: setOptions() and importLibrary().
  ```
- **Origen:** El código heredado instanciaba `new Loader({ apiKey, version: 'weekly', libraries: [...] })`, una API de la v1 que fue removida en `@googlemaps/js-api-loader` v2.
- **Bibliotecas inválidas solicitadas:** Se solicitaban bibliotecas con nombres no reconocidos por la API (`'routes'`, `'core'`). Las bibliotecas válidas para `importLibrary()` son: `'maps'`, `'marker'`, `'places'`, `'geometry'`.

### Causa 2: Bug de Desmontaje del Contenedor DOM en `MapPage.tsx`
- **Mecanismo del error:** `MapPage.tsx` retornaba vistas tempranas condicionales basadas en el estado del loader (`if (loaderStatus === 'NOT_CONFIGURED') return <NotConfiguredView />`, etc.).
- **Impacto:** Durante la resolución asíncrona de la promesa de carga, el elemento `<div ref={mapContainerRef} />` no estaba montado en el DOM (`mapContainerRef.current === null`), provocando que `GoogleMapsProvider.initializeMap(null)` fallara silenciosamente y dejara el mapa en estado no inicializado.

### Causa 3: Detección Tardía de Errores de Autenticación
- Cuando Google Maps rechaza una clave (por restricciones de HTTP Referrer, facturación o APIs no habilitadas), no siempre rechaza la promesa del script, sino que invoca el callback global `window.gm_authFailure()`. La aplicación anterior no capturaba esta función y no informaba al usuario sobre la causa exacta.

---

## 2. Solución de Ingeniería Implementada

### A. Modernización a la API Funcional v2
En `src/services/GoogleMapsLoader.ts`:
```typescript
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// 1. Configuración global no destructiva
setOptions({
  key: apiKey,
  v: 'weekly',
  mapIds: mapId ? [mapId] : undefined,
  language: 'es',
  region: 'US',
});

// 2. Carga concurrente de bibliotecas válidas
await Promise.all([
  importLibrary('maps'),
  importLibrary('marker'),
  importLibrary('places'),
  importLibrary('geometry'),
]);
```

### B. Contenedor del Mapa Permanente en el DOM
En `src/ui/pages/MapPage.tsx`, el contenedor del mapa `<div ref={mapContainerRef} className="w-full h-full" />` permanece siempre montado. Los estados informativos (carga, advertencias de configuración, modal de diagnóstico) se renderizan como superposiciones flotantes (`overlays`) con `backdrop-blur` sobre el mapa, asegurando que `mapContainerRef.current` tenga dimensiones válidas y nunca sea nulo.

### C. Captura No Intrusiva de `window.gm_authFailure`
```typescript
private static setupAuthFailureListener() {
  if (this.authListenerAttached || typeof window === 'undefined') return;
  this.authListenerAttached = true;

  const originalAuthFailure = (window as any).gm_authFailure;
  (window as any).gm_authFailure = () => {
    this.lastMapsAuthError = 'Google Maps Authentication Failure: Clave inválida, restricciones de referrer o facturación no habilitada.';
    this.status = 'ERROR';
    if (typeof originalAuthFailure === 'function') originalAuthFailure();
  };
}
```

---

## 3. Matriz de Diagnóstico de 8 Campos (Sin Exposición de Secretos)
El método `GoogleMapsLoader.getDiagnosticInfo(container)` genera un informe de 8 dimensiones para depuración sin imprimir la clave API completa:

1. **`configured` (boolean):** Indica si existe una clave no vacía en variables de entorno.
2. **`apiKeyPresent` (boolean):** Verifica la presencia de `VITE_GOOGLE_MAPS_API_KEY`.
3. **`apiKeyPrefix` (string):** Prefijo canónico de 4 caracteres (ej. `AIza...`) para certificar el formato sin exponer el secreto.
4. **`apiKeyLength` (number):** Longitud total en caracteres (ej. 39 caracteres).
5. **`mapIdPresent` (boolean):** Certifica la existencia de `VITE_GOOGLE_MAPS_MAP_ID` para soporte de marcadores avanzados (`AdvancedMarkerElement`).
6. **`loaderStatus` (string):** Estado actual (`'IDLE' | 'LOADING' | 'READY' | 'ERROR' | 'NOT_CONFIGURED'`).
7. **`mapsApiLoaded` (boolean):** Certifica si `window.google.maps` existe y está disponible.
8. **`mapContainerHasSize` (boolean):** Certifica que `container.clientWidth > 0` y `container.clientHeight > 0`.

---

## 4. Estado de Validación
- Pruebas unitarias en Vitest (`GoogleMapsLoader.test.ts`): **PASS**.
- Inspección visual en navegador: Modal de diagnóstico verificado en `/mapa`, reportando `READY`, `mapsApiLoaded: true`, `mapContainerHasSize: true`.
