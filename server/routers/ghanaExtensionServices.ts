import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

const GHANA_REGIONS = [
  "Greater Accra",
  "Western Region",
  "Central Region",
  "Eastern Region",
  "Ashanti Region",
  "Northern Region",
  "Upper East Region",
  "Upper West Region",
  "Volta Region",
  "Bono Region",
  "Bono East Region",
  "Ahafo Region",
  "Oti Region",
  "Savanna Region",
  "North East Region"
];

// Mock data for disease alerts by species
const DISEASE_ALERTS = {
  cattle: [
    { name: "East Coast Fever", severity: "high", symptoms: "Fever, reduced milk production", prevention: "Tick control, vaccination" },
    { name: "Foot and Mouth Disease", severity: "high", symptoms: "Blisters on hooves and mouth", prevention: "Vaccination, quarantine" },
    { name: "Mastitis", severity: "medium", symptoms: "Swollen udders, abnormal milk", prevention: "Hygiene, proper milking" }
  ],
  poultry: [
    { name: "Newcastle Disease", severity: "high", symptoms: "Twisted neck, paralysis", prevention: "Vaccination, biosecurity" },
    { name: "Avian Influenza", severity: "critical", symptoms: "Sudden death, respiratory signs", prevention: "Isolation, vaccination" },
    { name: "Coccidiosis", severity: "medium", symptoms: "Diarrhea, weight loss", prevention: "Sanitation, medication" }
  ],
  goats: [
    { name: "Peste des Petits Ruminants", severity: "high", symptoms: "Fever, diarrhea", prevention: "Vaccination" },
    { name: "Contagious Caprine Pleuropneumonia", severity: "high", symptoms: "Respiratory distress", prevention: "Vaccination, isolation" }
  ],
  sheep: [
    { name: "Foot Rot", severity: "medium", symptoms: "Lameness, hoof lesions", prevention: "Footbaths, hoof trimming" },
    { name: "Scrapie", severity: "high", symptoms: "Behavioral changes, tremors", prevention: "Genetic selection" }
  ],
  pigs: [
    { name: "African Swine Fever", severity: "critical", symptoms: "Fever, hemorrhage", prevention: "Strict biosecurity" },
    { name: "Swine Fever", severity: "high", symptoms: "Fever, diarrhea", prevention: "Vaccination" }
  ],
  rabbits: [
    { name: "Viral Hemorrhagic Disease", severity: "high", symptoms: "Sudden death, hemorrhage", prevention: "Vaccination" },
    { name: "Coccidiosis", severity: "medium", symptoms: "Diarrhea, weight loss", prevention: "Sanitation" }
  ]
};

// Mock market prices by region and species
const MARKET_PRICES = {
  "Greater Accra": {
    cattle: { price: 2500, unit: "per kg", trend: "stable" },
    poultry: { price: 35, unit: "per bird", trend: "up" },
    goats: { price: 1800, unit: "per kg", trend: "stable" },
    sheep: { price: 2000, unit: "per kg", trend: "down" },
    pigs: { price: 1200, unit: "per kg", trend: "stable" },
    milk: { price: 4.5, unit: "per liter", trend: "stable" },
    eggs: { price: 0.8, unit: "per egg", trend: "up" }
  },
  "Ashanti Region": {
    cattle: { price: 2400, unit: "per kg", trend: "stable" },
    poultry: { price: 32, unit: "per bird", trend: "stable" },
    goats: { price: 1700, unit: "per kg", trend: "up" },
    sheep: { price: 1900, unit: "per kg", trend: "stable" },
    pigs: { price: 1100, unit: "per kg", trend: "down" },
    milk: { price: 4.2, unit: "per liter", trend: "down" },
    eggs: { price: 0.75, unit: "per egg", trend: "stable" }
  }
};

// Mock extension officer contact info
const EXTENSION_OFFICERS = {
  "Greater Accra": [
    { name: "Mr. Kwame Asante", phone: "+233 24 123 4567", specialty: "Livestock Management", email: "kasante@agric.gov.gh" },
    { name: "Ms. Ama Osei", phone: "+233 24 234 5678", specialty: "Veterinary Services", email: "aosei@agric.gov.gh" }
  ],
  "Ashanti Region": [
    { name: "Mr. Yaw Mensah", phone: "+233 24 345 6789", specialty: "Crop Production", email: "ymensah@agric.gov.gh" },
    { name: "Ms. Abena Boateng", phone: "+233 24 456 7890", specialty: "Livestock", email: "aboateng@agric.gov.gh" }
  ]
};

export const ghanaExtensionServicesRouter = router({
  /**
   * Get disease alerts for a specific species
   */
  getDiseaseAlerts: protectedProcedure
    .input(z.object({
      species: z.enum(["cattle", "poultry", "goats", "sheep", "pigs", "rabbits"]),
      region: z.string().optional()
    }))
    .query(({ input }) => {
      const alerts = DISEASE_ALERTS[input.species as keyof typeof DISEASE_ALERTS] || [];
      return {
        species: input.species,
        region: input.region,
        alerts: alerts.map((alert, idx) => ({
          id: idx + 1,
          ...alert,
          lastUpdated: new Date().toISOString().split('T')[0],
          source: "Ghana Ministry of Food and Agriculture"
        }))
      };
    }),

  /**
   * Get current market prices for a region
   */
  getMarketPrices: protectedProcedure
    .input(z.object({
      region: z.string(),
      species: z.string().optional()
    }))
    .query(({ input }) => {
      const regionPrices = MARKET_PRICES[input.region as keyof typeof MARKET_PRICES] || 
        MARKET_PRICES["Greater Accra"];
      
      if (input.species) {
        const price = regionPrices[input.species as keyof typeof regionPrices];
        return {
          region: input.region,
          species: input.species,
          price: price || { price: 0, unit: "unknown", trend: "unknown" },
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      
      return {
        region: input.region,
        prices: regionPrices,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
    }),

  /**
   * Get extension officer contact information
   */
  getExtensionOfficers: protectedProcedure
    .input(z.object({
      region: z.string()
    }))
    .query(({ input }) => {
      const officers = EXTENSION_OFFICERS[input.region as keyof typeof EXTENSION_OFFICERS] || [];
      return {
        region: input.region,
        officers: officers.map((officer, idx) => ({
          id: idx + 1,
          ...officer
        })),
        totalCount: officers.length
      };
    }),

  /**
   * Get all Ghana regions for selection
   */
  getGhanaRegions: protectedProcedure
    .query(() => {
      return {
        regions: GHANA_REGIONS.map((region, idx) => ({
          id: idx + 1,
          name: region
        })),
        totalCount: GHANA_REGIONS.length
      };
    }),

  /**
   * Get weather-based risk assessment for livestock
   */
  getWeatherRiskAssessment: protectedProcedure
    .input(z.object({
      region: z.string(),
      species: z.enum(["cattle", "poultry", "goats", "sheep", "pigs", "rabbits"])
    }))
    .query(({ input }) => {
      // Mock weather risk data
      const riskFactors = {
        temperature: { current: 28, risk: "moderate", recommendation: "Provide shade and water" },
        humidity: { current: 65, risk: "low", recommendation: "Monitor for respiratory diseases" },
        rainfall: { current: 45, risk: "high", recommendation: "Improve drainage, watch for foot diseases" }
      };

      return {
        region: input.region,
        species: input.species,
        riskFactors,
        overallRisk: "moderate",
        recommendations: [
          "Ensure adequate water supply",
          "Monitor animal health closely",
          "Improve shelter conditions",
          "Check vaccination status"
        ],
        lastUpdated: new Date().toISOString()
      };
    }),

  /**
   * Get farming calendar with species-specific recommendations
   */
  getFarmingCalendar: protectedProcedure
    .input(z.object({
      species: z.enum(["cattle", "poultry", "goats", "sheep", "pigs", "rabbits"]),
      month: z.number().min(1).max(12).optional()
    }))
    .query(({ input }) => {
      const calendar = {
        cattle: {
          1: ["Breeding season", "Vaccination campaigns", "Supplementary feeding"],
          2: ["Breeding season", "Pasture management", "Health checks"],
          3: ["Calving season", "Milk production peak", "Parasite control"],
          4: ["Calving season", "Grazing management", "Veterinary checks"],
          5: ["Breeding season", "Herd health monitoring", "Feed planning"],
          6: ["Dry season preparation", "Water management", "Supplementary feeding"],
          7: ["Dry season", "Fodder conservation", "Health monitoring"],
          8: ["Dry season", "Supplementary feeding", "Breeding season"],
          9: ["Breeding season", "Pasture recovery", "Vaccination"],
          10: ["Breeding season", "Pasture improvement", "Health checks"],
          11: ["Breeding season", "Grazing season", "Parasite control"],
          12: ["Year-end health checks", "Breeding season", "Feed planning"]
        }
      };

      const monthActivities = calendar.cattle[input.month || new Date().getMonth() + 1];
      
      return {
        species: input.species,
        month: input.month || new Date().getMonth() + 1,
        activities: monthActivities || [],
        bestPractices: [
          "Maintain regular veterinary checkups",
          "Keep accurate records of all activities",
          "Practice good biosecurity measures",
          "Provide balanced nutrition",
          "Monitor animal health daily"
        ]
      };
    }),

  /**
   * Get best practices guide for a species
   */
  getBestPracticesGuide: protectedProcedure
    .input(z.object({
      species: z.enum(["cattle", "poultry", "goats", "sheep", "pigs", "rabbits"])
    }))
    .query(({ input }) => {
      const guides = {
        cattle: {
          title: "Best Practices for Cattle Farming in Ghana",
          sections: [
            {
              title: "Housing and Shelter",
              content: "Provide adequate shelter with good ventilation, protection from extreme weather, and sufficient space per animal."
            },
            {
              title: "Nutrition and Feeding",
              content: "Provide balanced diet with adequate protein, energy, minerals, and vitamins. Use local feed resources."
            },
            {
              title: "Health Management",
              content: "Implement vaccination programs, parasite control, and regular veterinary checkups."
            },
            {
              title: "Breeding",
              content: "Select animals based on productivity, disease resistance, and adaptability to local climate."
            },
            {
              title: "Record Keeping",
              content: "Maintain detailed records of breeding, health, production, and expenses for better management."
            }
          ]
        }
      };

      return guides.cattle || { title: "Best Practices", sections: [] };
    })
});
