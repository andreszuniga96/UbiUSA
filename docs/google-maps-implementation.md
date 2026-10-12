# Arquitectura e Implementación: Google Maps Platform (P1)
**Proyecto:** UbiUSA — Travel Intelligence  
**Componentes Principales:** `GoogleMapsProvider.ts`, `MapPage.tsx`, `PlaceDetailCard.tsx`  
**Estado:** EN PRODUCCIÓN

---

## 1. Visión y Principio Rector
Google Maps Platform es el **proveedor cartográfico online primario y exclusivo** de UbiUSA. No se utiliza Leaflet ni ningún proveedor secundario como mapa principal mientras el dispositivo cuente con conexión y configuración de API.

---

## 2. Componentes de la Arquitectura Cartográfica

```
┌─────────────────────────────────────────────────────────────┐
│                       MapPage.tsx                           │
│  - Contenedor de Mapa permanente en DOM                      │
│  - Barra de Filtros por Categoría y por Día del Itinerario │
│  - Drawer interactivo con PlaceDetailCard                   │
│  - Modal de Diagnóstico de 8 campos                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 GoogleMapsProvider.ts                       │
│  - google.maps.Map con estilos personalizados y Map ID     │
│  - AdvancedMarkerElement (o fallback a google.maps.Marker) │
│  - DirectionsService & DirectionsRenderer                   │
│  - PlacesService & Places API New                           │
│  - Bounds auto-fit inteligente según marcadores visibles   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  GoogleMapsLoader.ts                        │
│  - @googlemaps/js-api-loader v2 funcional (setOptions)      │
│  - importLibrary: 'maps', 'marker', 'places', 'geometry'    │
│  - Detección de window.gm_authFailure                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Pines Diferenciados con `AdvancedMarkerElement`
En `src/services/GoogleMapsProvider.ts`, cada tipo de entidad geográfica recibe un pin visualmente diferenciado con icono vectorial, color distintivo y tipografía estilizada:

| Categoría | Color Principal | Icono | Propósito |
| :--- | :---: | :---: | :--- |
| **Ubicación GPS Usuario** | `#2563eb` (Azul) | 📍 Pulso animado | Muestra la ubicación real obtenida por `navigator.geolocation`. |
| **Alojamiento** | `#059669` (Esmeralda) | 🏠 Casa | Airbnb Cambridge (Lynne), Bayonne (Carmelo) y Orlando. |
| **Punto de Encuentro** | `#4f46e5` (Índigo) | 🎯 Bandera | Ubicación oficial de inicio para cada uno de los 14 tours. |
| **Parada de Tour** | `#d97706` (Ámbar) | 🚶 Número ordenado | Puntos intermedios de los recorridos con historia y datos curiosos. |
| **Actividad General** | `#0284c7` (Cielo) | 🎟️ Ticket | Parques temáticos, ferries, rascacielos. |
| **Gastronomía** | `#ea580c` (Naranja) | 🍴 Cubiertos | Lugares curados con alto valor costo-beneficio. |
| **Tránsito / Estación** | `#e11d48` (Rosa) | 🚇 / 🚌 Estación | Terminales de autobús (South Station, Port Authority) y aeropuertos. |

### Fallback Automático
Si el navegador no soporta `AdvancedMarkerElement` o `VITE_GOOGLE_MAPS_MAP_ID` no está presente, el proveedor conmuta fluidamente a marcadores tradicionales `google.maps.Marker` utilizando iconos SVG codificados, evitando cualquier fallo visual.

---

## 4. Tarjeta Reutilizable de Detalle (`PlaceDetailCard.tsx`)
Cuando el usuario toca cualquier marcador o elemento de la lista, se abre la tarjeta con información enriquecida:
- **Encabezado:** Nombre del lugar, categoría y badge de fuente oficial.
- **Métricas:** Distancia caminable y tiempo estimado a pie desde la ubicación del usuario.
- **Información práctica:** Dirección completa, horario de apertura, teléfono y sitio web oficial.
- **Contenido editorial:**
  - *Historia y contexto:* Reseña histórica o arquitectónica relevante.
  - *Qué observar:* Detalles que no deben pasarse por alto.
  - *Dato curioso:* Anécdotas documentadas de la parada.
  - *Tip para la foto:* Ángulos y momentos ideales para capturar imágenes.
- **Botones de acción:**
  - `"Cómo llegar"`: Traza la ruta en vivo utilizando `DirectionsService`.
  - `"Ver en Google Maps"`: Enlace directo al mapa nativo externo con coordenadas exactas.

---

## 5. Filtros Dinámicos en `MapPage.tsx`
- **Por Capas:** Todas, Alojamientos, Puntos de Encuentro, Paradas de Tour, Gastronomía, Transporte.
- **Por Día del Itinerario:** Permite aislar solo los puntos correspondientes a una jornada específica (ej. 16 de octubre en Nueva York).
- **Por Tour Seleccionado:** Muestra la secuencia completa de paradas de un recorrido específico ajustando automáticamente el encuadre (`fitBounds`).
