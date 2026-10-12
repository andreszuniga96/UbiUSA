import { describe, it, expect } from 'vitest';
import { TravelRiskEngine } from '../services/TravelRiskEngine';
import { parseTripData } from '../data/seed/parser';
import { TimelineEvent, TransitPlan } from '../domain/types';

describe('TravelRiskEngine V8 Tests', () => {
  const bundle = parseTripData();

  it('detecta retraso crítico cuando la hora actual supera la hora del evento', () => {
    const nextEvent: TimelineEvent = {
      id: 'test-ev-1',
      title: 'Actividad de prueba 1',
      date: '2026-10-13',
      localTime: '10:00',
      timePrecision: 'exacta',
      status: 'confirmado',
      type: 'activity',
      updatedAt: Date.now(),
    };

    // 10:15 (15 min tarde)
    const simulatedNow = new Date('2026-10-13T10:15:00').getTime();
    const result = TravelRiskEngine.analyze(null, nextEvent, null, simulatedNow);

    expect(result.status).toBe('CRITICAL');
    expect(result.alerts.length).toBeGreaterThan(0);
    expect(result.alerts[0].message).toContain('tarde');
    expect(result.alerts[0].cause).toBeDefined();
    expect(result.alerts[0].recommendedAction).toBeDefined();
  });

  it('detecta riesgo de tiempo de traslado insuficiente', () => {
    const nextEvent: TimelineEvent = {
      id: 'test-ev-2',
      title: 'Actividad de prueba 2',
      date: '2026-10-13',
      localTime: '10:00',
      timePrecision: 'exacta',
      status: 'confirmado',
      type: 'activity',
      updatedAt: Date.now(),
    };

    const transitPlan: TransitPlan = {
      id: 'plan-1',
      routePlanId: 'route-1',
      transportType: '🚇 SUBWAY',
      durationMin: 45,
      transfers: 1,
      isFaster: true,
      source: 'STATIC',
    };

    // 09:30 (solo quedan 30 min, pero se requieren 45 min)
    const simulatedNow = new Date('2026-10-13T09:30:00').getTime();
    const result = TravelRiskEngine.analyze(null, nextEvent, transitPlan, simulatedNow);

    expect(result.status).toBe('CRITICAL');
    expect(result.alerts[0].message).toContain('traslado');
  });

  it('detecta compras y reservas pendientes críticas del viaje canónico', () => {
    const pendingAlerts = TravelRiskEngine.analyzePendingBookings(
      bundle.flights,
      bundle.accommodations,
      bundle.transport,
      bundle.activities
    );

    expect(pendingAlerts.length).toBeGreaterThan(0);
    // Debe incluir el vuelo interno EWR -> MCO
    expect(pendingAlerts.some(a => a.message.includes('vuelo') || a.message.includes('Vuelo'))).toBe(true);
    // Debe incluir alojamiento en Orlando
    expect(pendingAlerts.some(a => a.message.includes('Orlando'))).toBe(true);
    // Debe incluir transporte nocturno Boston -> NY
    expect(pendingAlerts.some(a => a.message.includes('nocturno') || a.message.includes('Boston'))).toBe(true);
  });

  it('detecta transiciones nocturnas en Boston, Nueva York y Houston', () => {
    const oct12Alerts = TravelRiskEngine.analyzeNocturnalTransitions('2026-10-12');
    expect(oct12Alerts.some(a => a.message.includes('Cambridge') || a.message.includes('Lynne'))).toBe(true);

    const oct15Alerts = TravelRiskEngine.analyzeNocturnalTransitions('2026-10-16');
    expect(oct15Alerts.some(a => a.message.includes('04:30') || a.message.includes('Port Authority'))).toBe(true);

    const oct21Alerts = TravelRiskEngine.analyzeNocturnalTransitions('2026-10-21');
    expect(oct21Alerts.some(a => a.message.includes('21 de octubre'))).toBe(true);

    const oct29Alerts = TravelRiskEngine.analyzeNocturnalTransitions('2026-10-29');
    expect(oct29Alerts.some(a => a.message.includes('Houston') || a.message.includes('49'))).toBe(true);
  });
});
