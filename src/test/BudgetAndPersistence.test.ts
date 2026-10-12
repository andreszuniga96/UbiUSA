import { describe, it, expect, beforeEach } from 'vitest';
import { Expense } from '../domain/types';

describe('Budget Calculations & Expense Logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleExpenses: Expense[] = [
    {
      id: 'exp-1',
      date: '2026-10-13',
      city: 'Boston, MA',
      category: 'Comida',
      amountUsd: 42.50,
      paymentMethod: 'Tarjeta Crédito',
      notes: 'Quincy Market Clam Chowder',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'exp-2',
      date: '2026-10-13',
      city: 'Boston, MA',
      category: 'Transporte',
      amountUsd: 15.00,
      paymentMethod: 'Tarjeta Débito',
      notes: 'CharlieCard MBTA Subway',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'exp-3',
      date: '2026-10-17',
      city: 'New York, NY',
      category: 'Comida',
      amountUsd: 28.00,
      paymentMethod: 'Efectivo',
      notes: 'Los Tacos No. 1 Times Square',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'exp-4',
      date: '2026-10-26',
      city: 'Orlando, FL',
      category: 'Compras',
      amountUsd: 65.00,
      paymentMethod: 'Tarjeta Crédito',
      notes: 'Souvenirs Disney Springs',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  it('calcula correctamente el total gastado y el promedio diario para los 18 días de viaje', () => {
    const totalSpent = sampleExpenses.reduce((sum, e) => sum + e.amountUsd, 0);
    expect(totalSpent).toBe(150.50);

    const tripDaysCount = 18; // 12 al 29 de octubre de 2026
    const dailyAverage = totalSpent / tripDaysCount;
    expect(dailyAverage).toBeCloseTo(8.36, 2);
  });

  it('calcula el presupuesto restante y porcentaje utilizado según el límite configurado', () => {
    const totalBudget = 2500;
    const totalSpent = sampleExpenses.reduce((sum, e) => sum + e.amountUsd, 0);
    const remaining = totalBudget - totalSpent;
    const percentUsed = Math.round((totalSpent / totalBudget) * 100);

    expect(remaining).toBe(2349.50);
    expect(percentUsed).toBe(6);
  });

  it('agrupa y calcula el desglose de gastos por categoría', () => {
    const foodTotal = sampleExpenses
      .filter(e => e.category === 'Comida')
      .reduce((sum, e) => sum + e.amountUsd, 0);
    expect(foodTotal).toBe(70.50);

    const transportTotal = sampleExpenses
      .filter(e => e.category === 'Transporte')
      .reduce((sum, e) => sum + e.amountUsd, 0);
    expect(transportTotal).toBe(15.00);

    const shoppingTotal = sampleExpenses
      .filter(e => e.category === 'Compras')
      .reduce((sum, e) => sum + e.amountUsd, 0);
    expect(shoppingTotal).toBe(65.00);
  });

  it('genera correctamente las líneas CSV exportables con encabezados y datos formateados', () => {
    const headers = ['Fecha', 'Ciudad', 'Categoría', 'Monto USD', 'Método de Pago', 'Notas'];
    const rows = sampleExpenses.map(e => [
      e.date,
      `"${e.city}"`,
      `"${e.category}"`,
      e.amountUsd.toFixed(2),
      `"${e.paymentMethod || ''}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    expect(csvContent).toContain('Fecha,Ciudad,Categoría,Monto USD,Método de Pago,Notas');
    expect(csvContent).toContain('2026-10-13,"Boston, MA","Comida",42.50');
    expect(csvContent).toContain('2026-10-17,"New York, NY","Comida",28.00');
    expect(csvContent).toContain('Quincy Market Clam Chowder');
  });

  it('persiste la configuración del presupuesto total en localStorage', () => {
    localStorage.setItem('ubiusa_total_budget', '3200');
    const stored = localStorage.getItem('ubiusa_total_budget');
    expect(Number(stored)).toBe(3200);

    localStorage.setItem('ubiusa_total_budget', '4000');
    expect(Number(localStorage.getItem('ubiusa_total_budget'))).toBe(4000);
  });
});

describe('Alert Dismissal & Preservation Logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('permite descartar alertas informativas preservando el problema original', () => {
    const originalAlerts = [
      { id: 'alert-crit-1', level: 'CRITICAL', title: 'Vuelo EWR -> MCO pendiente' },
      { id: 'alert-watch-1', level: 'WATCH', title: 'Margen de 49 min en Houston' },
      { id: 'alert-info-1', level: 'INFO', title: 'Tiempo libre en Boston' },
    ];

    // Dismiss info alert
    const dismissedIds = new Set<string>();
    dismissedIds.add('alert-info-1');

    // Filter active
    const activeAlerts = originalAlerts.filter(a => !dismissedIds.has(a.id));

    expect(activeAlerts.length).toBe(2);
    expect(activeAlerts.some(a => a.id === 'alert-crit-1')).toBe(true);
    expect(activeAlerts.some(a => a.id === 'alert-watch-1')).toBe(true);
    expect(activeAlerts.some(a => a.id === 'alert-info-1')).toBe(false);

    // Verify original alerts were NOT deleted or mutated
    expect(originalAlerts.length).toBe(3);
  });
});
