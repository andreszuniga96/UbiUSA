# Implementación de Lugares Cercanos y Gastronomía Costo-Beneficio (P3)
**Proyecto:** UbiUSA — Travel Intelligence  
**Componentes:** `RecommendationEngine.ts`, `ExploreCity.tsx`  
**Estado:** EN PRODUCCIÓN

---

## 1. Filosofía de Recomendación
Para un viaje de 18 días en Estados Unidos con dos personas (Iván y Gloria), comer bien sin gastar de más en zonas turísticas caras es un factor crítico de satisfacción.

El módulo **Nearby & Value-Food** no recomienda trampas para turistas ni restaurantes de lujo inaccesibles. En su lugar, utiliza un algoritmo transparente de **ValueScore** que equilibra costo, calidad y conveniencia de tiempo.

---

## 2. Algoritmo Transparente `ValueScore`
En `src/services/RecommendationEngine.ts`:

$$\text{ValueScore} = \text{Factor de Costo (40\%)} + \text{Factor de Valoración (35\%)} + \text{Factor de Proximidad (25\%)}$$

Donde:
1. **Factor de Costo ($0 - 4.0$ pts):** Mide la relación entre el tamaño de la porción y el precio real (escala de 1 a 10 de economía).
2. **Factor de Calidad ($0 - 3.5$ pts):** Rating verificado de Google Maps normalizado sobre 5 estrellas.
3. **Factor de Proximidad ($0 - 2.5$ pts):** Penaliza lugares que demanden más de 1.5 km de desvío o tiempos de espera incompatibles con el itinerario del día.

El puntaje final oscila entre $1.0$ y $9.9$ y se presenta con etiquetas legibles:
- `💰 ECONÓMICO` (Comida rápida de calidad, porciones abundantes por menos de $15 USD).
- `💰💰 BUEN COSTO-BENEFICIO` (Fast-casual de excelente sabor y precio justo, $15 - $25 USD).
- `💰💰💰 MODERADO` (Restaurante tradicional con servicio a la mesa).

---

## 3. Catálogo Verificado por Ciudad

### Boston & Cambridge
- **Boston Chowda Co (Quincy Market):** Almuerzo rápido; clam chowder tradicional en pan sourdough, porción contundente.
- **Tatte Bakery & Cafe (Harvard Square):** Desayuno y café artesanal en Cambridge; shakshuka y repostería europea.
- **Mike's Pastry (North End):** Cannoli gigantes clásicos de Boston para compartir; ideal al terminar el Freedom Trail.

### Manhattan & Brooklyn (Nueva York)
- **Joe's Pizza (Greenwich Village):** La porción de pizza clásica neoyorquina por excelencia ($4 - $5 USD); atención en 3 minutos.
- **Wah Fung No. 1 Fast Food (Chinatown):** Roast pork / char siu con arroz y vegetales; una de las mejores relaciones cantidad/precio de Manhattan.
- **Los Tacos No. 1 (Chelsea Market):** Tacos de adobada al pastor en tortilla recién prensada; rapidez insuperable antes de caminar el High Line.
- **Grimaldi's Pizzeria (DUMBO, Brooklyn):** Pizza en horno de carbón mineral con vistas al puente de Brooklyn; porciones para dos.

### Orlando (Disney Springs)
- **Earl of Sandwich (Disney Springs):** Sandwiches calientes artesanales (The Original 1762); la opción más económica y sabrosa de Disney Springs.
- **Blaze Fast-Fire'd Pizza:** Pizza artesanal personalizada horneada en 3 minutos a fuego vivo; precio fijo sin costo adicional por ingredientes.

---

## 4. Filtrado por Tiempo Disponible
El motor ajusta dinámicamente las recomendaciones según los minutos libres antes de la próxima actividad:
- **Menos de 30 minutos:** Solo opciones ultra-rápidas (`speedMinutes <= 20`), como pizzerías por porción o cafeterías al paso.
- **De 30 a 60 minutos:** Establecimientos fast-casual y panaderías (`speedMinutes <= 35`).
- **Más de 60 minutos:** Restaurantes con servicio y experiencias gastronómicas completas.

---

## 5. Puntos de Referencia en `ExploreCity.tsx`
Si el usuario no se encuentra físicamente en Estados Unidos (o el GPS no tiene señal), la interfaz permite seleccionar un punto de referencia del itinerario para explorar los alrededores:
- Ubicación GPS real del dispositivo.
- Airbnb Cambridge (Lynne).
- Boston Common (Inicio del Freedom Trail).
- Airbnb Bayonne (Carmelo).
- Spring St & Broadway (SoHo / NoLita).
- Times Square & Bryant Park (Manhattan).
- Disney Springs (Orlando).
