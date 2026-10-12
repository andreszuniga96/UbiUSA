import { RestaurantRecommendation } from '../domain/types';

export interface RecommendationContext {
  availableMinutes: number;
  budget: 'LOW' | 'MEDIUM' | 'PREMIUM';
  location: { lat: number; lng: number };
  timeOfDay?: 'Desayuno' | 'Almuerzo' | 'Cena' | 'Snack' | 'Café';
}

export interface CuratedFoodPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  city: string;
  neighborhood: string;
  foodCategory: 'Desayuno' | 'Almuerzo' | 'Cena' | 'Snack' | 'Café' | 'Postre' | 'Comida rápida';
  priceLevel: '💰 ECONÓMICO' | '💰💰 BUEN COSTO-BENEFICIO' | '💰💰💰 MODERADO' | '💰💰💰💰 EXPERIENCIA';
  costScore: number; // 1 to 10 (10 = very economical)
  googleRating: number; // e.g. 4.6
  specialty: string;
  whyRecommended: string;
  openingHours: string;
  speedMinutes: number; // Typical time to eat: 15, 30, 45, 60
}

export const VERIFIED_FOOD_PLACES: CuratedFoodPlace[] = [
  // Boston & Cambridge
  {
    id: 'food-bos-1',
    name: 'Boston Chowda Co (Quincy Market)',
    address: '1 Faneuil Hall Market Pl, Boston, MA 02109',
    lat: 42.3601,
    lng: -71.0558,
    city: 'Boston, MA',
    neighborhood: 'Faneuil Hall',
    foodCategory: 'Almuerzo',
    priceLevel: '💰💰 BUEN COSTO-BENEFICIO',
    costScore: 8.5,
    googleRating: 4.5,
    specialty: 'New England Clam Chowder servida en pan artesanal sourdough.',
    whyRecommended: 'Un clásico indispensable de Boston tras el Freedom Trail; servicio rápido y auténtico sabor de Nueva Inglaterra.',
    openingHours: '10:00 - 20:00',
    speedMinutes: 25,
  },
  {
    id: 'food-bos-2',
    name: 'Tatte Bakery & Cafe (Charles St)',
    address: '70 Charles St, Boston, MA 02114',
    lat: 42.3578,
    lng: -71.0699,
    city: 'Boston, MA',
    neighborhood: 'Beacon Hill',
    foodCategory: 'Desayuno',
    priceLevel: '💰💰 BUEN COSTO-BENEFICIO',
    costScore: 7.8,
    googleRating: 4.6,
    specialty: 'Shakshuka, croissants de pistacho y café de especialidad.',
    whyRecommended: 'Ambiente acogedor a pocos pasos de Boston Common; ideal para un desayuno de calidad antes del tour.',
    openingHours: '07:00 - 18:00',
    speedMinutes: 30,
  },
  {
    id: 'food-bos-3',
    name: 'Clover Food Lab (Harvard Sq)',
    address: '1326 Massachusetts Ave, Cambridge, MA 02138',
    lat: 42.3732,
    lng: -71.1188,
    city: 'Cambridge, MA',
    neighborhood: 'Harvard Square',
    foodCategory: 'Comida rápida',
    priceLevel: '💰 ECONÓMICO',
    costScore: 9.2,
    googleRating: 4.4,
    specialty: 'Sandwich de pita con berenjena crujiente y café de filtro.',
    whyRecommended: 'Muy cerca del alojamiento en Cambridge; comida rápida saludable y precios muy accesibles.',
    openingHours: '07:00 - 22:00',
    speedMinutes: 20,
  },

  // NYC Financial District
  {
    id: 'food-nyf-1',
    name: 'Joe\'s Pizza (Fulton Street)',
    address: '124 Fulton St, New York, NY 10038',
    lat: 40.7103,
    lng: -74.0076,
    city: 'New York, NY',
    neighborhood: 'Financial District',
    foodCategory: 'Comida rápida',
    priceLevel: '💰 ECONÓMICO',
    costScore: 9.6,
    googleRating: 4.6,
    specialty: 'Pizza clásica de queso y pepperoni estilo New York slice ($4-$5 por rebanada).',
    whyRecommended: 'A 5 minutos del WTC y Wall Street. Rápido, económico y de calidad constante.',
    openingHours: '10:00 - 02:00',
    speedMinutes: 15,
  },
  {
    id: 'food-nyf-2',
    name: 'Pisillo Italian Panini',
    address: '97 Nassau St, New York, NY 10038',
    lat: 40.7101,
    lng: -74.0079,
    city: 'New York, NY',
    neighborhood: 'Financial District',
    foodCategory: 'Almuerzo',
    priceLevel: '💰💰 BUEN COSTO-BENEFICIO',
    costScore: 8.8,
    googleRating: 4.7,
    specialty: 'Paninis gigantes con prosciutto di Parma, mozzarella fresca y rúcula.',
    whyRecommended: 'Un solo panini alcanza perfectamente para dos personas, maximizando la relación costo-beneficio.',
    openingHours: '11:00 - 18:00',
    speedMinutes: 20,
  },

  // NYC Midtown (Bryant Park / Times Square / Rockefeller)
  {
    id: 'food-nym-1',
    name: 'Los Tacos No. 1 (Times Square)',
    address: '229 W 43rd St, New York, NY 10036',
    lat: 40.7573,
    lng: -73.9866,
    city: 'New York, NY',
    neighborhood: 'Times Square',
    foodCategory: 'Comida rápida',
    priceLevel: '💰 ECONÓMICO',
    costScore: 9.4,
    googleRating: 4.8,
    specialty: 'Tacos de adobada (pastor) y carne asada en tortillas hechas a mano al momento.',
    whyRecommended: 'Considerado unánimemente el mejor taco rápido de Nueva York; fila rápida y excelente precio.',
    openingHours: '11:00 - 22:00',
    speedMinutes: 20,
  },
  {
    id: 'food-nym-2',
    name: 'Joe\'s Shanghai (Chinatown / Midtown)',
    address: '46 Bowery, New York, NY 10013',
    lat: 40.7154,
    lng: -73.9968,
    city: 'New York, NY',
    neighborhood: 'Chinatown',
    foodCategory: 'Almuerzo',
    priceLevel: '💰💰 BUEN COSTO-BENEFICIO',
    costScore: 8.6,
    googleRating: 4.4,
    specialty: 'Xiao Long Bao (dumplings de sopa de cerdo y cangrejo).',
    whyRecommended: 'Pioneros de los soup dumplings en Nueva York; sabroso y económico para compartir.',
    openingHours: '11:00 - 22:30',
    speedMinutes: 40,
  },

  // NYC SoHo & Greenwich Village
  {
    id: 'food-nyv-1',
    name: 'Mamoun\'s Falafel (MacDougal St)',
    address: '119 MacDougal St, New York, NY 10012',
    lat: 40.7298,
    lng: -74.0006,
    city: 'New York, NY',
    neighborhood: 'Greenwich Village',
    foodCategory: 'Comida rápida',
    priceLevel: '💰 ECONÓMICO',
    costScore: 9.8,
    googleRating: 4.6,
    specialty: 'Sandwich de falafel en pan pita con tahini fresco (menos de $6).',
    whyRecommended: 'El restaurante de falafel más antiguo de NYC (1971); opción ultrarrápida y económica para el tour nocturno.',
    openingHours: '11:00 - 03:00',
    speedMinutes: 15,
  },
  {
    id: 'food-nyv-2',
    name: 'Ferrara Bakery & Cafe',
    address: '195 Grand St, New York, NY 10013',
    lat: 40.7194,
    lng: -73.9972,
    city: 'New York, NY',
    neighborhood: 'Little Italy',
    foodCategory: 'Postre',
    priceLevel: '💰💰 BUEN COSTO-BENEFICIO',
    costScore: 8.2,
    googleRating: 4.5,
    specialty: 'Cannoli crujiente de ricotta fresca y espresso italiano.',
    whyRecommended: 'Histórica confitería fundada en 1892; parada icónica durante el recorrido de SoHo y Little Italy.',
    openingHours: '09:00 - 23:00',
    speedMinutes: 20,
  },

  // Brooklyn (Williamsburg & DUMBO)
  {
    id: 'food-bkl-1',
    name: 'Grimaldi\'s Pizzeria (DUMBO)',
    address: '1 Front St, Brooklyn, NY 11201',
    lat: 40.7027,
    lng: -73.9935,
    city: 'Brooklyn, NY',
    neighborhood: 'DUMBO',
    foodCategory: 'Cena',
    priceLevel: '💰💰 BUEN COSTO-BENEFICIO',
    costScore: 8.4,
    googleRating: 4.4,
    specialty: 'Pizza clásica horneada en horno de carbón mineral con vistas al puente de Brooklyn.',
    whyRecommended: 'Al final del tour de contrastes o fotográfico; las porciones son generosas para dos personas.',
    openingHours: '11:30 - 22:00',
    speedMinutes: 45,
  },

  // Orlando
  {
    id: 'food-orl-1',
    name: 'Earl of Sandwich (Disney Springs)',
    address: '1750 E Buena Vista Dr, Lake Buena Vista, FL 32830',
    lat: 28.3708,
    lng: -81.5145,
    city: 'Orlando, FL',
    neighborhood: 'Disney Springs',
    foodCategory: 'Almuerzo',
    priceLevel: '💰 ECONÓMICO',
    costScore: 9.3,
    googleRating: 4.6,
    specialty: 'Sandwich artesanal caliente The Original 1762 (roast beef y cheddar derretido).',
    whyRecommended: 'La opción con mejor costo-beneficio de todo Disney Springs durante el día de reclamo de boletos.',
    openingHours: '09:00 - 23:00',
    speedMinutes: 25,
  },
  {
    id: 'food-orl-2',
    name: 'Blaze Fast-Fire\'d Pizza (Disney Springs)',
    address: '1508 E Buena Vista Dr, Lake Buena Vista, FL 32830',
    lat: 28.3715,
    lng: -81.5160,
    city: 'Orlando, FL',
    neighborhood: 'Disney Springs',
    foodCategory: 'Cena',
    priceLevel: '💰 ECONÓMICO',
    costScore: 9.0,
    googleRating: 4.5,
    specialty: 'Pizza personal personalizada horneada en 3 minutos a fuego vivo.',
    whyRecommended: 'Excelente precio fijo sin importar la cantidad de ingredientes que agregues.',
    openingHours: '10:30 - 23:00',
    speedMinutes: 25,
  },
];

export class RecommendationEngine {
  /**
   * Calcula el ValueScore interno de UbiUSA.
   * Factores transparentes:
   * 1. Eficiencia de costo (40%): relación entre porción y precio.
   * 2. Valoración de usuarios verificada (35%): rating de Google.
   * 3. Proximidad / conveniencia de tiempo (25%): rapidez de servicio y cercanía.
   */
  static calculateValueScore(place: CuratedFoodPlace, distanceMeters: number): number {
    const costFactor = (place.costScore / 10) * 4.0;
    const ratingFactor = (place.googleRating / 5.0) * 3.5;
    
    // Proximity factor (up to 2.5 points): decreases if further than 1.5km
    const km = distanceMeters / 1000;
    const proximityMultiplier = Math.max(0.5, 1.0 - (km * 0.2));
    const proximityFactor = 2.5 * proximityMultiplier;

    const rawScore = costFactor + ratingFactor + proximityFactor;
    return Math.min(9.9, Math.round(rawScore * 10) / 10);
  }

  static getFoodRecommendations(context: RecommendationContext): RestaurantRecommendation[] {
    const { availableMinutes, budget, location } = context;

    // Filter by available time:
    // < 30 min: only quick options (speedMinutes <= 20)
    // 30 - 60 min: fast casual / bakery (speedMinutes <= 35)
    // > 60 min: all options
    let candidates = VERIFIED_FOOD_PLACES.filter(place => {
      if (availableMinutes < 30) {
        return place.speedMinutes <= 20;
      } else if (availableMinutes <= 60) {
        return place.speedMinutes <= 35;
      }
      return true;
    });

    // Budget filtering
    if (budget === 'LOW') {
      candidates = candidates.filter(p => p.priceLevel === '💰 ECONÓMICO');
    }

    // Distance calculation
    return candidates.map(p => {
      // Haversine
      const R = 6371e3;
      const dLat = (p.lat - location.lat) * Math.PI / 180;
      const dLon = (p.lng - location.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(location.lat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = Math.round(R * c);

      const valueScore = this.calculateValueScore(p, distance);

      return {
        id: p.id,
        title: p.name,
        category: 'FOOD' as const,
        reason: `${p.specialty} (${p.whyRecommended})`,
        distance,
        priceLevel: p.priceLevel,
        foodCategory: p.foodCategory,
        valueScore,
        quality: p.googleRating,
      };
    }).sort((a, b) => b.valueScore - a.valueScore);
  }

  static getEssentialServices(
    targetCategory?: string,
    coords?: { lat: number; lng: number }
  ): (CuratedEssentialService & { distanceMeters?: number })[] {
    let list = VERIFIED_ESSENTIAL_SERVICES;
    if (targetCategory && targetCategory !== 'ALL') {
      list = list.filter(s => s.category === targetCategory);
    }

    if (!coords) return list;

    return list.map(s => {
      const R = 6371e3;
      const dLat = (s.lat - coords.lat) * Math.PI / 180;
      const dLon = (s.lng - coords.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(coords.lat * Math.PI / 180) * Math.cos(s.lat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMeters = Math.round(R * c);

      return { ...s, distanceMeters };
    }).sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
  }
}

export interface CuratedEssentialService {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  city: string;
  category: 'RESTROOM' | 'PHARMACY' | 'CONVENIENCE' | 'CAFE';
  serviceType: 'Baño público' | 'Farmacia' | 'Tienda de conveniencia' | 'Café';
  isFree?: boolean;
  is24h?: boolean;
  notes: string;
  verificationSource: 'MUNICIPAL_VERIFIED' | 'CURATED' | 'OFFICIAL';
}

export const VERIFIED_ESSENTIAL_SERVICES: CuratedEssentialService[] = [
  // Baños Públicos
  {
    id: 'rest-bos-1',
    name: 'Baños Públicos Boston Common Visitor Center',
    address: '139 Tremont St, Boston, MA 02111',
    lat: 42.3553,
    lng: -71.0637,
    city: 'Boston, MA',
    category: 'RESTROOM',
    serviceType: 'Baño público',
    isFree: true,
    notes: 'Baño municipal gratuito verificado en el Centro de Información de Visitantes del parque.',
    verificationSource: 'MUNICIPAL_VERIFIED',
  },
  {
    id: 'rest-bos-2',
    name: 'Baños Públicos Faneuil Hall / Quincy Market',
    address: '4 S Market St, Boston, MA 02109',
    lat: 42.3601,
    lng: -71.0549,
    city: 'Boston, MA',
    category: 'RESTROOM',
    serviceType: 'Baño público',
    isFree: true,
    notes: 'Baños públicos amplios en la planta baja del mercado central.',
    verificationSource: 'CURATED',
  },
  {
    id: 'rest-ny-1',
    name: 'Baño Público de Bryant Park (Premiado)',
    address: 'Calle 42 y Sexta Avenida, New York, NY 10018',
    lat: 40.7536,
    lng: -73.9832,
    city: 'New York, NY',
    category: 'RESTROOM',
    serviceType: 'Baño público',
    isFree: true,
    notes: 'Famoso baño municipal de libre acceso con atención permanente, flores frescas y música clásica.',
    verificationSource: 'MUNICIPAL_VERIFIED',
  },
  {
    id: 'rest-ny-2',
    name: 'Baños Públicos Grand Central Terminal',
    address: '89 E 42nd St (Lower Level / Dining Concourse), New York, NY 10017',
    lat: 40.7527,
    lng: -73.9772,
    city: 'New York, NY',
    category: 'RESTROOM',
    serviceType: 'Baño público',
    isFree: true,
    notes: 'Baños públicos limpios y verificados en el nivel inferior de la terminal.',
    verificationSource: 'OFFICIAL',
  },
  {
    id: 'rest-ny-3',
    name: 'Baños de Castle Clinton / Battery Park',
    address: 'Battery Park, New York, NY 10004',
    lat: 40.7035,
    lng: -74.0169,
    city: 'New York, NY',
    category: 'RESTROOM',
    serviceType: 'Baño público',
    isFree: true,
    notes: 'Baño público del Servicio de Parques Nacionales antes de tomar el ferry a la Estatua de la Libertad.',
    verificationSource: 'OFFICIAL',
  },

  // Farmacias y Tiendas de Conveniencia
  {
    id: 'pharma-bos-1',
    name: 'CVS Pharmacy (Boylston / Copley)',
    address: '587 Boylston St, Boston, MA 02116',
    lat: 42.3506,
    lng: -71.0768,
    city: 'Boston, MA',
    category: 'PHARMACY',
    serviceType: 'Farmacia',
    notes: 'Farmacia completa, medicamentos sin receta, bebidas y snacks.',
    verificationSource: 'CURATED',
  },
  {
    id: 'pharma-ny-1',
    name: 'Duane Reade / Walgreens (Wall Street 24h)',
    address: '40 Wall St, New York, NY 10005',
    lat: 40.7071,
    lng: -74.0097,
    city: 'New York, NY',
    category: 'PHARMACY',
    serviceType: 'Farmacia',
    is24h: true,
    notes: 'Abierto 24 horas en el Distrito Financiero. Medicinas, agua y artículos de viaje.',
    verificationSource: 'CURATED',
  },
  {
    id: 'pharma-ny-2',
    name: 'CVS Pharmacy (Times Square / Midtown)',
    address: '1500 Broadway, New York, NY 10036',
    lat: 40.7569,
    lng: -73.9861,
    city: 'New York, NY',
    category: 'PHARMACY',
    serviceType: 'Farmacia',
    notes: 'Farmacia de paso amplio en Midtown Manhattan.',
    verificationSource: 'CURATED',
  },
  {
    id: 'conv-bay-1',
    name: 'Walgreens Bayonne',
    address: '1080 Broadway, Bayonne, NJ 07002',
    lat: 40.6756,
    lng: -74.1082,
    city: 'Bayonne, NJ',
    category: 'CONVENIENCE',
    serviceType: 'Tienda de conveniencia',
    notes: 'Muy conveniente cerca del alojamiento en Bayonne.',
    verificationSource: 'CURATED',
  },
  {
    id: 'conv-orl-1',
    name: 'Walgreens Palm Parkway (Orlando)',
    address: '12100 S Apopka Vineland Rd, Orlando, FL 32836',
    lat: 28.3846,
    lng: -81.5034,
    city: 'Orlando, FL',
    category: 'CONVENIENCE',
    serviceType: 'Tienda de conveniencia',
    notes: 'Farmacia y abastecimiento de agua y snacks para los parques de Disney y Universal.',
    verificationSource: 'CURATED',
  },
];
