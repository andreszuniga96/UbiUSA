# Estrategia Offline Honesta y Arquitectura PWA (P5)
**Proyecto:** UbiUSA — Travel Intelligence  
**Componentes:** `VitePWA` (`sw.js`), Dexie v3 (`db.ts`), `useTripStore.ts`  
**Estado:** EN PRODUCCIÓN

---

## 1. Principio de Honestidad Técnica
En aplicaciones de viaje en el mundo real, los desarrolladores a menudo prometen falsamente que "Google Maps funciona completamente offline". En la práctica, la API de JavaScript de Google Maps depende de servidores remotos para renderizar mosaicos vectoriales, geocodificación y cálculo de tráfico en vivo.

**La postura de UbiUSA — Travel Intelligence es de absoluta honestidad técnica:**
1. **La cartografía interactiva de Google Maps requiere conexión a internet.**
2. **El 100% de la inteligencia de viaje, itinerario, guías de tours, coordenadas y reservas funciona 100% OFFLINE.**
3. En ausencia de red móvil o Wi-Fi, la aplicación informa con transparencia: `"Modo Offline — Datos locales disponibles, cartografía en espera de conexión"`.

---

## 2. Niveles de Disponibilidad en Modo Desconectado

```
┌─────────────────────────────────────────────────────────────┐
│                 Nivel 1: Capa PWA (Service Worker)          │
│  - Bundles JS, CSS, HTML, manifiesto e iconos cacheados     │
│  - Apertura instantánea sin pantalla en blanco              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Nivel 2: Capa de Datos (IndexedDB / Dexie)       │
│  - 18 días de itinerario y 21 eventos de cronograma         │
│  - 3 vuelos con sus 5 segmentos y códigos de reserva        │
│  - 3 alojamientos con teléfonos, anfitriones e instrucciones│
│  - 1 transporte nocturno normalizado                        │
│  - 14 tours con sus 73 paradas verificadas completas        │
│  - 6 tareas críticas con persistencia de cambios locales    │
│  - 3 documentos y tickets confirmados                       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Nivel 3: Capa de Sensores del Dispositivo       │
│  - Chip GPS satelital del teléfono (navigator.geolocation)  │
│  - Cálculo local de distancias en metros (fórmula Haversine)│
│  - Brújula y orientación relativa hacia la próxima parada   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. ¿Qué puede hacer el viajero SIN INTERNET?
- **Consultar cualquier vuelo, terminal y código PNR:** Disponible en `/reservas` y en el Dashboard.
- **Revisar las instrucciones de acceso nocturno de Cambridge:** El viajero que aterriza a las 23:43 en Boston puede consultar el teléfono y datos de Lynne incluso si aún no tiene chip SIM estadounidense.
- **Recorrer cualquier tour guiado:** Toda la información de las paradas (historia, qué observar, datos curiosos y consejos de fotos) está guardada en la base de datos local.
- **Marcar tareas completadas:** Se guardan en IndexedDB y se encolan en `syncQueue` para futura sincronización.
- **Medir la distancia a la siguiente parada:** El GPS nativo del dispositivo calcula la distancia en metros a las coordenadas de la parada activa sin gastar datos.

---

## 4. Detección Reactiva de Conectividad
En `src/stores/useTripStore.ts`:
```typescript
window.addEventListener('online', () => {
  useTripStore.getState().setOnline(true);
});

window.addEventListener('offline', () => {
  useTripStore.getState().setOnline(false);
});
```
La interfaz actualiza instantáneamente su badge superior entre `● ONLINE` (verde) y `○ MODO OFFLINE` (ámbar), sin recargar la página ni interrumpir la navegación del usuario.
