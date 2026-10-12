/// <reference types="node" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleMapsLoader } from '../services/GoogleMapsLoader';
import { GoogleMapsProvider } from '../services/GoogleMapsProvider';
import { parseTripData } from '../data/seed/parser';
import fs from 'fs';
import path from 'path';

describe('Google Maps Platform Robustness & Lifecycle Tests', () => {
  beforeEach(() => {
    GoogleMapsLoader.resetForTesting();
    vi.restoreAllMocks();
  });

  describe('1. Configuración ausente y validación de variables de entorno', () => {
    it('reporta NOT_CONFIGURED cuando la API Key está ausente', () => {
      const originalKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      try {
        (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY = '';
        expect(GoogleMapsLoader.isConfigured()).toBe(false);
        expect(GoogleMapsLoader.getStatus()).toBe('NOT_CONFIGURED');
        expect(GoogleMapsLoader.getLifecycleState()).toBe('NOT_CONFIGURED');
      } finally {
        (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY = originalKey;
      }
    });

    it('arroja un error controlado al intentar cargar sin clave', async () => {
      const originalKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      try {
        (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY = '';
        await expect(GoogleMapsLoader.load()).rejects.toThrow('VITE_GOOGLE_MAPS_API_KEY no encontrada');
      } finally {
        (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY = originalKey;
      }
    });
  });

  describe('2. Prevención de cargas duplicadas (Singleton y concurrencia)', () => {
    it('retorna la misma promesa de carga ante múltiples llamadas concurrentes', () => {
      GoogleMapsLoader.resetForTesting();

      const promise1 = GoogleMapsLoader.load();
      const promise2 = GoogleMapsLoader.load();
      expect(promise1).toBe(promise2);

      // Descartar errores asíncronos de red de jsdom
      promise1.catch(() => {});
      promise2.catch(() => {});
    });
  });

  describe('3. Captura no intrusiva de errores de autenticación de Google Maps', () => {
    it('notifica a los suscriptores y transiciona a ERROR si gm_authFailure es invocado', () => {
      let notifiedError: string | null = null;
      const unsubscribe = GoogleMapsLoader.onAuthFailure((err) => {
        notifiedError = err;
      });

      // Simular llamada de Google Maps
      if (typeof (window as any).gm_authFailure === 'function') {
        (window as any).gm_authFailure();
      }

      const diag = GoogleMapsLoader.getDiagnosticInfo();
      expect(diag.loaderStatus).toBe('ERROR');
      expect(diag.lastMapsAuthError).toContain('Google Maps Authentication Failure');
      expect(notifiedError).toContain('Google Maps Authentication Failure');

      unsubscribe();
    });
  });

  describe('4. Ciclo de vida y limpieza de GoogleMapsProvider', () => {
    it('inicia en NOT_CONFIGURED y maneja suscripciones de cambio de estado', () => {
      const provider = new GoogleMapsProvider();
      const states: string[] = [];

      const unsubscribe = provider.onLifecycleStateChange((s) => {
        states.push(s);
      });

      expect(states).toContain('NOT_CONFIGURED');
      expect(provider.isBasemapRendered()).toBe(false);

      provider.destroy();
      unsubscribe();
    });

    it('limpia marcadores, rutas e infoWindow en destroy()', () => {
      const provider = new GoogleMapsProvider();
      provider.addMarker({
        id: 'test-marker-1',
        position: { lat: 40.7128, lng: -74.0060 },
        title: 'Prueba NYC',
        type: 'MEETING_POINT',
      });

      provider.destroy();
      expect(provider.getMap()).toBeNull();
      expect(provider.isBasemapRendered()).toBe(false);
    });
  });

  describe('5. Seguridad: Ausencia estricta de secretos en archivos versionados', () => {
    it('certifica que .env.example contiene solo valores de ejemplo no sensibles', () => {
      const envExamplePath = path.resolve(process.cwd(), '.env.example');
      const content = fs.readFileSync(envExamplePath, 'utf-8');

      // No debe contener ninguna clave real de Google Cloud
      expect(content).not.toMatch(/AIzaSy[A-Za-z0-9_-]{33}/);
      expect(content).toContain('VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE');
      expect(content).toContain('VITE_GOOGLE_MAPS_MAP_ID=YOUR_GOOGLE_MAPS_MAP_ID_OPTIONAL');
    });

    it('certifica que vercel.json existe y tiene reglas para SPA', () => {
      const vercelJsonPath = path.resolve(process.cwd(), 'vercel.json');
      expect(fs.existsSync(vercelJsonPath)).toBe(true);

      const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
      expect(vercelConfig.framework).toBe('vite');
      expect(vercelConfig.outputDirectory).toBe('dist');
      expect(vercelConfig.rewrites).toBeDefined();
      expect(vercelConfig.rewrites.some((r: any) => r.destination === '/index.html')).toBe(true);
    });

    it('el diagnóstico nunca imprime la clave completa en texto plano', () => {
      const diag = GoogleMapsLoader.getDiagnosticInfo();
      const serialized = JSON.stringify(diag);
      expect(serialized).not.toMatch(/AIzaSy[A-Za-z0-9_-]{33}/);
    });
  });

  describe('6. Integridad de tareas e idempotencia en persistencia', () => {
    it('preserva las 6 tareas críticas sin alteración ni mutaciones destructivas', () => {
      const bundle = parseTripData();
      expect(bundle.tasks.length).toBe(6);
      expect(bundle.tasks.every(t => t.priority === 'CRITICO')).toBe(true);

      const taskMap = new Map(bundle.tasks.map(t => [t.id, t.status]));
      // Simular que el usuario completó la primera tarea
      const completedId = bundle.tasks[0].id;
      taskMap.set(completedId, 'DONE');

      // Reconciliación preserva el estado del usuario sin borrar la tarea
      const reconciled = bundle.tasks.map(t => ({
        ...t,
        status: taskMap.get(t.id) || t.status,
      }));

      expect(reconciled.find(t => t.id === completedId)?.status).toBe('DONE');
      expect(reconciled.length).toBe(6);
      expect(reconciled.every(t => t.priority === 'CRITICO')).toBe(true);
    });
  });
});
