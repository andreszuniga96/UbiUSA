# Implementación y Estrategia de Transporte (P1 / P4)
**Proyecto:** UbiUSA — Travel Intelligence  
**Componentes:** `TravelContextEngine.ts`, `DirectionsService`, `db.transport`, `db.flights`  
**Estado:** EN PRODUCCIÓN

---

## 1. Visión General de la Red de Transporte
El itinerario de Iván y Gloria abarca tres escalas geográficas:
1. **Intercontinental:** Vuelos internacionales Colombia ↔ Estados Unidos vía Panamá.
2. **Interurbano:** Autobús nocturno expreso Boston → Nueva York.
3. **Urbano Local:** Metros y buses de Boston (MBTA), Nueva York (MTA / OMNY), tren ligero de New Jersey (HBLR) y transporte en Orlando.

---

## 2. Vuelos Oficiales y Segmentos Canónicos

```
Ida (Lunes 12 Octubre 2026) - Copa Airlines (PNR: ABUMLB)
  [CLO Cali] ──CM 660 (12:06)──> [PTY Panamá] (13:51)
  [PTY Panamá] ──CM 311 (18:02)──> [BOS Boston Logan] (23:43)

Regreso (Jueves 29 Octubre 2026) - United Airlines (PNR: HDEETE / AB32PO)
  [MCO Orlando] ──UA 1178 (06:00)──> [IAH Houston] (07:44)
  [IAH Houston] ──UA 1032 (09:35)──> [PTY Panamá] (14:48)
  [PTY Panamá] ──CM 661 (18:25)──> [CLO Cali] (20:10)

Tramo Interno (25 o 26 Octubre 2026) - Pendiente de Compra
  [EWR Newark / NY] ──Propuesto──> [MCO Orlando]
```

---

## 3. Transporte Terrestre Interurbano (Autobús Nocturno Boston → NY)
- **Origen:** Boston South Station (`700 Atlantic Ave, Boston, MA 02110`). Coordenadas: `42.3519, -71.0552`.
- **Destino:** New York Port Authority Bus Terminal (`625 8th Ave, New York, NY 10018`). Coordenadas: `40.7570, -73.9902`.
- **Hora de Salida Canónica:** 15 de octubre a las 24:00 (normalizado a `2026-10-16T00:00:00`).
- **Hora de Llegada Canónica:** 16 de octubre a las 04:30 AM.
- **Logística Asociada:** 
  - Tarea crítica 2: Dejar maletas en almacenamiento seguro de Boston durante el día 15 tras el check-out de Cambridge.
  - Tarea crítica 4: Traslado directo desde Port Authority a Bayonne temprano en la mañana del 16 para dejar equipaje en el Airbnb de Carmelo antes de iniciar el tour de SoHo/Little Italy a las 14:00.

---

## 4. Transporte Urbano Local y Conexiones Clave

### Boston & Cambridge
- **Llegada Aeropuerto Logan (BOS):** Metro Línea Azul (Blue Line) desde Airport Station o Silver Line SL1 a South Station, con conexión a Línea Roja (Red Line) hacia Harvard/Central Square (Cambridge).
- **Movilidad turística:** Tarjeta CharlieCard / pago contactless para MBTA.

### Nueva York & Bayonne (New Jersey)
- **Conexión Bayonne ↔ Manhattan:**
  1. Hudson-Bergen Light Rail (HBLR) desde la estación de Bayonne hasta Exchange Place (Jersey City).
  2. PATH Train desde Exchange Place hasta World Trade Center (Oculus) en Manhattan (tiempo estimado: 25 - 35 min).
- **Metro de Nueva York (MTA):** Sistema OMNY con tarjeta contactless directa en torniquetes.

---

## 5. Algoritmo "Salir a las XX:XX" (`TravelContextEngine.ts`)
Para evitar retrasos y estrés durante el viaje, el asistente calcula la hora óptima para ponerse en marcha:

$$\text{Hora de Salida} = \text{Hora de Inicio de la Actividad} - (\text{Tiempo Estimado de Tránsito} + \text{Margen de Seguridad})$$

- **Tiempo Estimado de Tránsito:** Calculado en 30 minutos estándar para desplazamientos urbanos promedio (caminata + metro).
- **Margen de Seguridad:** 15 a 20 minutos fijos de colchón para imprevistos (espera de trenes, transbordos, orientación en calle).
- **Semáforo de Riesgo:**
  - `SAFE` (Margen $> 15$ min): Tiempo holgado para caminar con calma o tomar un café.
  - `WATCH` (Margen entre 5 y 15 min): Debe iniciarse el traslado sin demoras.
  - `RISK` / `CRITICAL` (Margen $< 5$ min o negativo): Alerta visual destacada en rojo con recomendación de transporte directo o taxi.
