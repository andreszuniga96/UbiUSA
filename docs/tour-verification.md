# Verificación Exhaustiva de Tours y Modo en Vivo (P2)
**Proyecto:** UbiUSA — Travel Intelligence  
**Archivo de Datos:** `src/data/seed/verifiedToursData.ts`  
**Página de Ejecución:** `src/ui/pages/TourMode.tsx`  
**Total de Tours Oficiales:** 14 actividades / 14 tours verificados  
**Estado:** VERIFICADO Y OPERATIVO

---

## 1. Inventario de los 14 Tours Canónicos Verificados

| # | ID Actividad / Tour | Nombre Oficial del Tour | Ciudad / Región | Proveedor | Punto de Encuentro Oficial | Paradas |
| :-: | :--- | :--- | :--- | :--- | :--- | :-: |
| 1 | `act-0` / `tour-0` | Aspectos destacados de Boston: free tour | Boston, MA | GuruWalk | Boston Common Visitor Center | 7 |
| 2 | `act-1` / `tour-1` | Tour de la Revolución Americana y Freedom Trail | Boston, MA | GuruWalk | Massachusetts State House (Beacon St) | 6 |
| 3 | `act-2` / `tour-2` | Tour por Harvard y Cambridge | Cambridge, MA | GuruWalk | Out of Town News / Harvard Yard Gate | 5 |
| 4 | `act-3` / `tour-3` | SoHo, Little Italy y Chinatown | Nueva York, NY | GuruWalk | Spring St & Broadway (Frente a Uniqlo) | 6 |
| 5 | `act-4` / `tour-4` | Estatua de la Libertad e Isla Ellis | Nueva York, NY | Statue City Cruises | Castle Clinton National Monument | 4 |
| 6 | `act-5` / `tour-5` | Distrito Financiero y Wall Street | Nueva York, NY | GuruWalk | Bowling Green (Frente al Charging Bull) | 5 |
| 7 | `act-6` / `tour-6` | Greenwich Village y Chelsea High Line | Nueva York, NY | GuruWalk | Washington Square Arch | 5 |
| 8 | `act-7` / `tour-7` | Tour de Contrastes de Nueva York | NY / Bronx / Queens | Excursión Oficial | Hotel Pennsylvania / Midtown Manhattan | 5 |
| 9 | `act-8` / `tour-8` | Excursión de 1 Día a Washington D.C. | Washington D.C. | Excursión Oficial | Terminal Port Authority Bus Terminal NY | 6 |
| 10 | `act-9` / `tour-9` | Excursión de 2 Días a las Cataratas del Niágara | Niágara, NY | Excursión Oficial | Port Authority Bus Terminal (8th Ave) | 4 |
| 11 | `act-10` / `tour-10`| Reclamo de Boletos y Disney Springs | Orlando, FL | Disney Parks | Disney Springs Welcome Center | 4 |
| 12 | `act-11` / `tour-11`| Día Completo en Magic Kingdom | Orlando, FL | Walt Disney World | Magic Kingdom Main Entrance Gate | 6 |
| 13 | `act-12` / `tour-12`| Día Completo en Universal Studios Florida | Orlando, FL | Universal Orlando | Universal Studios Arch & Globe | 5 |
| 14 | `act-13` / `tour-13`| Retorno y Traslado al Aeropuerto MCO | Orlando, FL | Logística Propia | Terminal B Level 3 MCO Airport | 3 |

---

## 2. Estructura de Parada Verificada
Cada una de las 73 paradas documentadas en `verifiedToursData.ts` contiene datos de rigor histórico y recomendaciones de campo:

```typescript
export interface TourStop {
  id: string;
  tourId: string;
  order: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  durationMinutes: number;
  description: string;
  history: string;         // Antecedentes históricos documentados
  whatToSee: string[];     // Elementos visuales destacados que observar
  funFact: string;         // Anécdotas y curiosidades no evidentes
  photoTip: string;        // Consejos de perspectiva, encuadre e iluminación
  source: 'GURUWALK' | 'OFFICIAL' | 'CURATED';
}
```

---

## 3. Experiencia "Modo Tour en Vivo" (`TourMode.tsx`)
El usuario interactúa con el tour en tiempo real con las siguientes capacidades:
- **Seguimiento GPS Continuo:** Monitorea la posición del viajero con `LocationService.watchPosition()` y actualiza el pin del usuario en el mapa.
- **Detección de Proximidad:** Calcula en tiempo real la distancia euclidiana/geodésica en metros a la parada activa.
- **Navegación de Paradas:** Botón para confirmar parada visitada (`handleCompleteStop`), avanzando automáticamente el índice activo y recalculando la ruta.
- **Persistencia en Dexie (`TourSession`):** Guarda el progreso (`currentStopIndex`, `completedStops`, `status`, `elapsedTime`) en la base de datos local para que el viajero no pierda su avance si la pantalla se apaga o se recarga la aplicación.
- **Minimapa Interactivo:** Despliega las paradas numeradas, el trazado del recorrido y la posición actual del usuario.
- **Ficha Técnica de la Parada:** Muestra historia, elementos destacados, anécdotas y tips fotográficos directamente en la tarjeta de la parada activa.
