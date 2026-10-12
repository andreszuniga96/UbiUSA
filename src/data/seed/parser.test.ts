import { describe, it, expect } from 'vitest';
import { parseTripData } from './parser';

describe('TripData Parser', () => {
  it('should parse trip metadata correctly', () => {
    const { trip } = parseTripData();
    expect(trip.id).toBe('usa-trip-2026');
    expect(trip.startDate).toBe('2026-10-12');
    expect(trip.endDate).toBe('2026-10-29');
  });

  it('should parse flights, accommodations, activities, and transport', () => {
    const { events } = parseTripData();
    expect(events.length).toBeGreaterThan(0);

    const flights = events.filter(e => e.type === 'flight');
    expect(flights.length).toBe(3);
    
    const accoms = events.filter(e => e.type === 'accommodation');
    expect(accoms.length).toBe(3);
  });

  it('should parse critical tasks correctly', () => {
    const { tasks } = parseTripData();
    expect(tasks.length).toBe(6);
    expect(tasks[0].priority).toBe('CRITICO');
    expect(tasks[0].status).toBe('PENDING');
  });
});
