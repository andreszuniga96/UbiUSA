import { describe, it, expect } from 'vitest';
import { TravelContextEngine } from '../services/TravelContextEngine';
import { parseTripData } from '../data/seed/parser';

describe('TravelContextEngine', () => {
  const bundle = parseTripData();

  it('evalúa correctamente el estado previo al viaje (Pre-Trip)', () => {
    // Fecha simulada: 1 de octubre de 2026 (antes del viaje del 12 de oct)
    const simulatedNow = new Date('2026-10-01T12:00:00').getTime();

    const result = TravelContextEngine.evaluatePreTrip(
      simulatedNow,
      bundle.alerts,
      bundle.tasks
    );

    expect(result.isBeforeTrip).toBe(true);
    expect(result.daysUntilTrip).toBeGreaterThanOrEqual(10);
    expect(result.firstFlight.airline).toBe('Copa Airlines');
    expect(result.firstFlight.bookingCode).toBe('ABUMLB');
    expect(result.firstFlight.departureTime).toBe('12:06');
    expect(result.firstFlight.route).toContain('CLO');
    expect(result.firstFlight.route).toContain('BOS');
    expect(result.criticalTasksCount).toBe(6);
    expect(result.concreteActions.length).toBeGreaterThanOrEqual(6);
  });

  it('evalúa correctamente el contexto durante el viaje (In-Trip) en Boston', () => {
    const targetDate = '2026-10-13';
    const simulatedTimeMs = new Date('2026-10-13T09:00:00').getTime();

    const result = TravelContextEngine.evaluateInTrip(
      targetDate,
      simulatedTimeMs,
      bundle.events,
      bundle.alerts
    );

    expect(result.city).toBe('Boston, MA');
    expect(result.nextEvent).not.toBeNull();
    expect(result.leaveByFormatted).toBeDefined();
    expect(result.leaveByFormatted).not.toBe('--:--');
    expect(result.status).toBeDefined();
    expect(result.meetingPoint).toBeDefined();
  });

  it('calcula la hora de salida con margen de seguridad y tiempo libre en Nueva York', () => {
    const targetDate = '2026-10-16';
    const simulatedTimeMs = new Date('2026-10-16T11:00:00').getTime();

    const result = TravelContextEngine.evaluateInTrip(
      targetDate,
      simulatedTimeMs,
      bundle.events,
      bundle.alerts
    );

    expect(result.city).toContain('Nueva York');
    expect(result.transitEstimateMin).toBe(30);
    expect(result.marginMin).toBe(15);
    expect(result.recommendedFood.length).toBeGreaterThan(0);
  });
});
