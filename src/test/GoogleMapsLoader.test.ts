import { describe, it, expect } from 'vitest';
import { GoogleMapsLoader } from '../services/GoogleMapsLoader';

describe('GoogleMapsLoader', () => {
  it('genera un diagnóstico estructurado sin exponer la clave API en texto plano', () => {
    const diagnosis = GoogleMapsLoader.getDiagnosticInfo();

    expect(diagnosis).toHaveProperty('apiKeyPresent');
    expect(diagnosis).toHaveProperty('mapIdPresent');
    expect(diagnosis).toHaveProperty('loaderStatus');
    expect(diagnosis).toHaveProperty('mapsApiLoaded');
    expect(diagnosis).toHaveProperty('mapContainerHasSize');
    expect(diagnosis).toHaveProperty('diagnosticDetails');

    // NUNCA debe contener la clave completa
    const serialized = JSON.stringify(diagnosis);
    expect(serialized).not.toContain('AIzaSy'); // No debe filtrar la clave completa
  });

  it('detecta si las variables de entorno están presentes', () => {
    const isConfigured = GoogleMapsLoader.isConfigured();
    expect(typeof isConfigured).toBe('boolean');
  });
});
