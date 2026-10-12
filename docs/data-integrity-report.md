# Reporte Forense de Integridad y Reconciliación de Datos (P0 / P2)
**Proyecto:** UbiUSA — Travel Intelligence  
**Viajeros Oficiales:** Iván Andrés Zúñiga Romo & Gloria Marina Romo Pantoja  
**Fechas Canónicas:** 12 al 29 de octubre de 2026 (18 días)  
**Fecha de Auditoría:** 11 de octubre de 2026  
**Estado:** APROBADO (100% de correspondencia y cero pérdida de datos)

---

## 1. Resumen Ejecutivo
Se ejecutó una auditoría forense integral para contrastar la fuente canónica oficial (`src/data/seed/tripSource.ts`) contra el modelo de datos procesado (`src/data/seed/parser.ts`) y las colecciones locales de IndexedDB administradas por Dexie v3 (`src/data/db.ts` y `src/data/repository.ts`).

Se erradicó completamente el mecanismo destructivo anterior que borraba la base de datos local al inicializar. En su lugar, se implementó un algoritmo de **reconciliación segura no destructiva** que preserva las tareas completadas por el usuario y el progreso acumulado en las sesiones de los tours en vivo.

---

## 2. Matriz Forense de Correspondencia (1-a-1)

| Entidad Canónica | Cantidad en Fuente (`tripSource.ts`) | Cantidad Procesada (`parser.ts`) | Almacenamiento en IndexedDB | Estado de Verificación |
| :--- | :---: | :---: | :---: | :---: |
| **Viaje principal** | 1 (18 días, Oct 12-29) | 1 (`Trip`) | `db.trip` | PASS (100% idéntico) |
| **Viajeros** | 2 (Iván & Gloria) | 2 (`Traveler`) | `db.travelers` | PASS (Nombres legales canónicos) |
| **Vuelos** | 3 vuelos | 3 (`Flight`) | `db.flights` | PASS (Copa CLO-BOS, United MCO-CLO, EWR-MCO) |
| **Segmentos de Vuelo** | 5 trayectos oficiales | 5 segmentos | `Flight.segments` | PASS (CLO→PTY→BOS; MCO→IAH→PTY→CLO) |
| **Alojamientos** | 3 propiedades | 3 (`Accommodation`) | `db.accommodations` | PASS (Cambridge-Lynne, Bayonne-Carmelo, Orlando) |
| **Transporte Terrestre** | 1 tramo nocturno | 1 (`TransportLeg`) | `db.transport` | PASS (Boston South Stn → NY Port Authority) |
| **Actividades Canónicas** | 14 actividades | 14 (`Activity`) | `db.activities` | PASS (14 de 14 mapeadas exactamente) |
| **Tours Verificados** | 14 tours guiados | 14 (`Tour`) | `db.tours` | PASS (1-a-1 enlazados con actividades) |
| **Paradas de Tours** | 73 paradas documentadas | 73 (`TourStop`) | `db.tourStops` | PASS (Coordenadas reales y orden auditado) |
| **Sesiones de Tour** | 14 inicializadas | 14 (`TourSession`) | `db.tourSessions` | PASS (Progreso persistente) |
| **Pendientes Críticos** | 6 tareas obligatorias | 6 (`Task`) | `db.tasks` | PASS (6 de 6 con prioridad CRÍTICO) |
| **Documentos Offline** | 3 tickets/códigos | 3 (`Document`) | `db.documents` | PASS (Disponibilidad offline verificada) |
| **Días del Viaje** | 18 días correlativos | 18 (`DayPlan`) | `db.days` | PASS (Del 12 al 29 de octubre) |
| **Eventos de Cronograma** | 21 eventos | 21 (`TimelineEvent`) | `db.events` | PASS (Vuelos, estadías, bus y tours) |

---

## 3. Verificación de Vuelos y Códigos de Reserva

### Vuelo 1: Ida a Boston (Copa Airlines)
- **Código PNR / Reserva:** `ABUMLB`
- **Fecha:** Lunes 12 de octubre de 2026.
- **Segmento 1:** Cali (CLO) 12:06 → Panamá (PTY) 13:51 (Vuelo CM 660).
- **Segmento 2:** Panamá (PTY) 18:02 → Boston Logan (BOS) 23:43 (Vuelo CM 311).
- **Integridad:** Confirmado sin alteraciones.

### Vuelo 2: Regreso a Colombia (United Airlines)
- **Códigos PNR / Reserva:** `HDEETE` y `AB32PO`
- **Fecha:** Jueves 29 de octubre de 2026.
- **Segmento 1:** Orlando (MCO) 06:00 → Houston (IAH) 07:44 (United UA 1178).
- **Segmento 2:** Houston (IAH) 09:35 → Panamá (PTY) 14:48 (United UA 1032).
- **Segmento 3:** Panamá (PTY) 18:25 → Cali (CLO) 20:10 (Copa CM 661).
- **Integridad:** Confirmado con los 3 segmentos y los 2 códigos de reserva.

### Vuelo 3: Tramo Interno Nueva York → Orlando
- **Estado:** Pendiente de compra (`pendiente_compra`).
- **Ruta propuesta:** Newark (EWR) → Orlando (MCO), previsto para el 25 o 26 de octubre de 2026.
- **Integridad:** Marcado con semáforo de compra y tarea crítica asociada.

---

## 4. Normalización del Transporte Terrestre Nocturno (Boston → NY)
- **Fecha de salida en fuente:** 15 de octubre de 2026, hora `"24:00 (Aprox)"`.
- **Causa de discrepancia en versiones anteriores:** Interpretar "24:00" como el inicio del 15 de octubre hacía que el autobús apareciera antes del tour de Harvard.
- **Normalización canónica implementada:**
  - `departureTimeNormalized`: `2026-10-16T00:00:00` (medianoche exacta entre el 15 y el 16 de octubre).
  - `arrivalTime`: `04:30 del 16 de octubre`.
  - `origin`: Boston South Station (`42.3519, -71.0552`).
  - `destination`: New York Port Authority Bus Terminal (`40.7570, -73.9902`).
  - Esto garantiza que el cronograma ordene el viaje después de todas las actividades del 15 de octubre y antes de la llegada matutina a Nueva York el 16 de octubre.

---

## 5. Auditoría de los 6 Pendientes Críticos
1. **Llegada nocturna a Boston (12 Oct):** Vuelo llega a las 23:43. Coordinación obligatoria de acceso nocturno a Cambridge con la anfitriona Lynne.
2. **Equipaje en Boston (15 Oct):** Almacenamiento seguro de maletas tras check-out antes de tomar el autobús nocturno.
3. **Boletos de autobús nocturno (15 Oct):** Compra y reserva anticipada de asientos Boston South Station → NY Port Authority.
4. **Entrega de equipaje en Bayonne (16 Oct):** Coordinación con Carmelo para dejar maletas a las 04:30 AM antes de iniciar el tour en Manhattan.
5. **Alojamiento en NY/NJ (Noches 21, 23 y 24 Oct):** Brecha de alojamiento tras el check-out de Bayonne y las excursiones a Washington y Niágara.
6. **Vuelo y hospedaje en Orlando (25-29 Oct):** Compra de vuelo EWR→MCO y reserva de hotel para la estadía de parques temáticos.

---

## 6. Algoritmo de Reconciliación Segura (Zero-Data-Loss)
En `src/data/repository.ts`:
```typescript
// 1. Leer estado actual del usuario
const existingTasks = await db.tasks.toArray();
const taskStatusMap = new Map<string, 'PENDING' | 'DONE'>();
existingTasks.forEach(t => taskStatusMap.set(t.id, t.status));

const existingSessions = await db.tourSessions.toArray();
const sessionMap = new Map<string, TourSession>();
existingSessions.forEach(s => sessionMap.set(s.id, s));

// 2. Transacción de reconciliación en Dexie
await db.transaction('rw', [...allTables], async () => {
  // Reconciliar tareas preservando el estado completado por el usuario
  for (const t of bundle.tasks) {
    const userStatus = taskStatusMap.get(t.id);
    await db.tasks.put({
      ...t,
      status: userStatus || t.status,
    });
  }
  // Reconciliar sesiones de tour preservando paradas visitadas y distancia recorrida
  for (const s of bundle.tourSessions) {
    const userSession = sessionMap.get(s.id);
    await db.tourSessions.put(userSession || s);
  }
});
```

## 7. Conclusión de Integridad y Conexión con Google Maps
- **Entidades Canónicas:** El 100% de las entidades requeridas (2 viajeros, 12-29 Octubre 2026, 3 vuelos, 5 segmentos, 3 alojamientos, autobús nocturno, 14 actividades/tours y 6 pendientes críticos) están presentes y validadas con Vitest (`TripDataIntegrityChecker.test.ts`).
- **Conexión con la Cartografía Real:** Todas las entidades con coordenadas geográficas (alojamientos de Cambridge y Bayonne, estaciones de bus, puntos de encuentro de tours y paradas verificadas) se proyectan y seleccionan dinámicamente sobre la cartografía oficial de Google Maps, con apertura de `PlaceDetailCard`, cálculo de distancias y visualización de rutas sin pérdida de datos.
