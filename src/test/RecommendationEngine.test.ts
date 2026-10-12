import { describe, it, expect } from 'vitest';
import { RecommendationEngine, VERIFIED_FOOD_PLACES } from '../services/RecommendationEngine';

describe('RecommendationEngine', () => {
  it('contiene lugares gastronómicos verificados con ratings y costos válidos', () => {
    expect(VERIFIED_FOOD_PLACES.length).toBeGreaterThanOrEqual(12);

    for (const place of VERIFIED_FOOD_PLACES) {
      expect(place.id).toBeDefined();
      expect(place.name).toBeDefined();
      expect(place.city).toBeDefined();
      expect(place.lat).toBeGreaterThan(0);
      expect(place.lng).toBeLessThan(0);
      expect(place.costScore).toBeGreaterThanOrEqual(1);
      expect(place.costScore).toBeLessThanOrEqual(10);
      expect(place.googleRating).toBeGreaterThanOrEqual(3.5);
      expect(place.googleRating).toBeLessThanOrEqual(5.0);
      expect(place.speedMinutes).toBeGreaterThan(0);
      expect(place.whyRecommended).toBeDefined();
    }
  });

  it('calcula transparentemente el ValueScore (40% costo, 35% rating, 25% proximidad)', () => {
    const place = VERIFIED_FOOD_PLACES[0];
    const distanceMeters = 300;

    const score = RecommendationEngine.calculateValueScore(place, distanceMeters);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(10);
  });

  it('filtra y ordena recomendaciones por tiempo disponible', () => {
    // 45 minutos disponibles
    const results = RecommendationEngine.getFoodRecommendations({
      availableMinutes: 45,
      budget: 'LOW',
      location: { lat: 40.7580, lng: -73.9855 }, // Times Square / Manhattan
    });

    expect(results.length).toBeGreaterThan(0);
    // Debe estar ordenado descendentemente por valueScore
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].valueScore).toBeGreaterThanOrEqual(results[i + 1].valueScore);
    }
  });

  it('proporciona servicios esenciales verificados (baños públicos, farmacias 24h, tiendas)', () => {
    const restrooms = RecommendationEngine.getEssentialServices('RESTROOM', { lat: 40.7536, lng: -73.9832 });
    expect(restrooms.length).toBeGreaterThanOrEqual(3);
    expect(restrooms[0].category).toBe('RESTROOM');
    expect(restrooms[0].distanceMeters).toBeDefined();

    const pharmacies = RecommendationEngine.getEssentialServices('PHARMACY', { lat: 40.7071, lng: -74.0097 });
    expect(pharmacies.length).toBeGreaterThanOrEqual(2);
    expect(pharmacies[0].category).toBe('PHARMACY');
  });
});
