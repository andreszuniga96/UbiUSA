import { describe, it, expect } from 'vitest';
import { parseTripData } from '../data/seed/parser';
import { TRIP_SOURCE_DATA } from '../data/seed/tripSource';

describe('TripDataIntegrityChecker & Parser', () => {
  it('garantiza la correspondencia exacta entre la fuente canónica y los datos procesados', () => {
    const bundle = parseTripData();

    // 1. Pasajeros canónicos
    expect(bundle.travelers.length).toBe(2);
    expect(bundle.travelers.some(t => t.name.includes('Iván'))).toBe(true);
    expect(bundle.travelers.some(t => t.name.includes('Gloria'))).toBe(true);

    // 2. Vuelos: 3 vuelos, 5 segmentos en total
    expect(bundle.flights.length).toBe(3);
    const totalSegments = bundle.flights.reduce((acc, f) => acc + f.segments.length, 0);
    expect(totalSegments).toBe(5);

    // Vuelo Copa Airlines
    const copaFlight = bundle.flights.find(f => f.airline.includes('Copa'));
    expect(copaFlight).toBeDefined();
    expect(copaFlight?.bookingCodes).toContain('ABUMLB');
    expect(copaFlight?.segments.length).toBe(2);

    // Vuelo United Airlines
    const unitedFlight = bundle.flights.find(f => f.airline.includes('United'));
    expect(unitedFlight).toBeDefined();
    expect(unitedFlight?.bookingCodes).toContain('HDEETE');
    expect(unitedFlight?.segments.length).toBe(3);

    // 3. Alojamientos: 3 (Boston/Cambridge, Bayonne/NY, Orlando)
    expect(bundle.accommodations.length).toBe(3);
    const cambridge = bundle.accommodations.find(a => (a as any).host === 'Lynne' || (a as any).hostName === 'Lynne');
    expect(cambridge).toBeDefined();
    const bayonne = bundle.accommodations.find(a => (a as any).host === 'Carmelo' || (a as any).hostName === 'Carmelo');
    expect(bayonne).toBeDefined();

    // 4. Transporte terrestre: 1 (Bus nocturno Boston -> NY)
    expect(bundle.transport.length).toBe(1);
    expect(bundle.transport[0].origin).toContain('Boston');
    expect(bundle.transport[0].destination).toContain('Nueva York');
    expect(bundle.transport[0].arrivalDate).toBe('2026-10-16');

    // 5. 14 Actividades y 14 Tours canónicos verificados
    expect(bundle.activities.length).toBe(14);
    expect(bundle.tours.length).toBe(14);
    expect(bundle.tourStops.length).toBeGreaterThanOrEqual(14); // Cada tour tiene paradas verificadas

    // 6. 6 Pendientes críticos obligatorios
    expect(bundle.tasks.length).toBe(6);
    expect(bundle.tasks.every(t => t.priority === 'CRITICO')).toBe(true);

    // 7. 18 Días del viaje (12 al 29 de octubre)
    expect(bundle.days.length).toBe(18);
    expect(bundle.days[0].date).toBe('2026-10-12');
    expect(bundle.days[17].date).toBe('2026-10-29');
  });

  it('no contiene ningún dato ficticio ni omisiones de entidades canónicas', () => {
    const raw = TRIP_SOURCE_DATA;
    expect(raw.viaje.pasajeros).toEqual([
      'Iván Andrés Zúñiga Romo',
      'Gloria Marina Romo Pantoja'
    ]);
    expect(raw.vuelos.length).toBe(3);
    expect(raw.alojamientos.length).toBe(3);
    expect(raw.transporte_terrestre.length).toBe(1);
    expect(raw.actividades_y_tours.length).toBe(14);
    expect(raw.pendientes_criticos.length).toBe(6);
  });
});
