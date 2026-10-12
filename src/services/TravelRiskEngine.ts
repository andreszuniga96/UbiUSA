// src/services/TravelRiskEngine.ts
import { TimelineEvent, TravelAlert, TransitPlan } from '../domain/types';

export interface RiskAnalysis {
  status: 'SAFE' | 'WATCH' | 'RISK' | 'CRITICAL';
  alerts: TravelAlert[];
}

export class TravelRiskEngine {
  static analyze(
    currentEvent: TimelineEvent | null,
    nextEvent: TimelineEvent | null,
    transit: TransitPlan | null,
    currentTimeMs: number
  ): RiskAnalysis {
    const alerts: TravelAlert[] = [];
    let highestStatus: 'SAFE' | 'WATCH' | 'RISK' | 'CRITICAL' = 'SAFE';

    const upgradeStatus = (newStatus: 'SAFE' | 'WATCH' | 'RISK' | 'CRITICAL') => {
      const severity = { 'SAFE': 0, 'WATCH': 1, 'RISK': 2, 'CRITICAL': 3 };
      if (severity[newStatus] > severity[highestStatus]) {
        highestStatus = newStatus;
      }
    };

    if (!nextEvent || !nextEvent.localTime) return { status: 'SAFE', alerts };

    const nextEventTime = new Date(`${nextEvent.date}T${nextEvent.localTime}`).getTime();
    const timeUntilNext = nextEventTime - currentTimeMs;

    // 1. Are we late?
    if (timeUntilNext < 0) {
      alerts.push({
        id: `alert-late-${Date.now()}`,
        type: 'CRITICAL',
        message: 'Llegas tarde a tu siguiente actividad.',
        createdAt: currentTimeMs
      });
      upgradeStatus('CRITICAL');
      return { status: highestStatus, alerts };
    }

    // 2. Is there enough time to travel?
    if (transit) {
      const requiredTravelTimeMs = transit.durationMin * 60000;
      const bufferMs = 15 * 60000; // 15 mins buffer
      
      if (timeUntilNext < requiredTravelTimeMs) {
        alerts.push({
          id: `alert-travel-${Date.now()}`,
          type: 'CRITICAL',
          message: 'El tiempo de traslado estimado es mayor al tiempo disponible.',
          createdAt: currentTimeMs
        });
        upgradeStatus('CRITICAL');
      } else if (timeUntilNext < (requiredTravelTimeMs + bufferMs)) {
        alerts.push({
          id: `alert-travel-buffer-${Date.now()}`,
          type: 'RISK',
          message: 'Tienes un margen muy ajustado para llegar a tiempo.',
          createdAt: currentTimeMs
        });
        upgradeStatus('RISK');
      }
    } else {
      // No transit info, use a generic fallback (e.g. less than 30 mins -> watch)
      if (timeUntilNext < 30 * 60000) {
        alerts.push({
          id: `alert-prep-${Date.now()}`,
          type: 'WATCH',
          message: 'Prepárate para salir hacia tu próxima actividad pronto.',
          createdAt: currentTimeMs
        });
        upgradeStatus('WATCH');
      }
    }

    // 3. Overlapping events (if current event exists and has duration)
    // For simplicity, assumed 2h duration if not present
    if (currentEvent && currentEvent.localTime) {
      const currentEventTime = new Date(`${currentEvent.date}T${currentEvent.localTime}`).getTime();
      const assumedDurationMs = 2 * 3600000; // 2 hours
      const currentEventEndTime = currentEventTime + assumedDurationMs;

      if (currentEventEndTime > nextEventTime) {
         alerts.push({
          id: `alert-overlap-${Date.now()}`,
          type: 'CRITICAL',
          message: 'Tus actividades se solapan.',
          createdAt: currentTimeMs
        });
        upgradeStatus('CRITICAL');
      }
    }

    return { status: highestStatus, alerts };
  }
}
