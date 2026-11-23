export interface SeedCropIssue {
  title: string;
  causeDescription: string;
  resolutionDescription: string;
  imageUrl?: string | null;
}

export interface SeedCrop {
  id: string;
  name: string;
  scientificName: string;
  category: 'Leafy Greens' | 'Herbs' | 'Fruiting' | 'Root Vegetables' | 'Brassicas' | 'Other';
  phMin: number;
  phMax: number;
  ecMin: number;
  ecMax: number;
  cfMin: number;
  cfMax: number;
  ppm500Min: number;
  ppm500Max: number;
  ppm700Min: number;
  ppm700Max: number;
  isCustomCalculations: boolean;
  tempMinC: number;
  tempMaxC: number;
  lightRequirement: string;
  growthTips: string;
  imageUrl?: string | null;
  issues: SeedCropIssue[];
}

export const SEED_CROPS: SeedCrop[] = [
  {
    id: 'crop-lettuce',
    name: 'Lettuce (Head/Bibb)',
    scientificName: 'Lactuca sativa',
    category: 'Leafy Greens',
    phMin: 5.5,
    phMax: 6.5,
    ecMin: 0.8,
    ecMax: 1.2,
    cfMin: 8,
    cfMax: 12,
    ppm500Min: 400,
    ppm500Max: 600,
    ppm700Min: 560,
    ppm700Max: 840,
    isCustomCalculations: false,
    tempMinC: 15,
    tempMaxC: 22,
    lightRequirement: '12 - 14 hours/day (14 - 17 DLI)',
    growthTips: 'Cool temp lover; prone to tip-burn if EC is high. Maintain gentle airflow over canopy.',
    imageUrl: null,
    issues: [
      {
        title: 'Tip Burn (Calcium Deficiency)',
        causeDescription: 'Rapid transpiration during high heat or low airflow limits calcium transport to inner leaf margins, or EC is excessively high.',
        resolutionDescription: 'Improve horizontal airflow with oscillating fans, reduce EC to below 1.2 mS/cm, and ensure nighttime humidity allows root pressure.',
        imageUrl: null,
      },
      {
        title: 'Bolting (Premature Flowering)',
        causeDescription: 'Water temperature consistently exceeding 24°C or prolonged photoperiods trigger premature flower stalk formation and bitter flavor.',
        resolutionDescription: 'Keep water temperature between 18-20°C using nutrient reservoir chillers and harvest early when high ambient temperatures persist.',
        imageUrl: null,
      },
    ],
  },
  {
    id: 'crop-basil',
    name: 'Basil (Sweet Genovese)',
    scientificName: 'Ocimum basilicum',
    category: 'Herbs',
    phMin: 5.5,
    phMax: 6.5,
    ecMin: 1.0,
    ecMax: 1.6,
    cfMin: 10,
    cfMax: 16,
    ppm500Min: 500,
    ppm500Max: 800,
    ppm700Min: 700,
    ppm700Max: 1120,
    isCustomCalculations: false,
    tempMinC: 20,
    tempMaxC: 28,
    lightRequirement: '14 - 16 hours/day (15 - 18 DLI)',
    growthTips: 'Warmth required. Lower EC prevents woody stems. Regular pinching promotes bushy lateral growth.',
    imageUrl: null,
    issues: [
      {
        title: 'Fusarium Wilt',
        causeDescription: 'Fungal pathogen in nutrient solution entering via damaged roots, causing sudden wilting and dark brown stem lesions.',
        resolutionDescription: 'Sterilize reservoir and irrigation lines with food-grade hydrogen peroxide, use clean certified seed, and maintain water temps below 22°C.',
        imageUrl: null,
      },
      {
        title: 'Downy Mildew',
        causeDescription: 'High relative humidity (>85%) and poor air movement allow Peronospora belbahrii spores to germinate on leaf undersides.',
        resolutionDescription: 'Reduce relative humidity below 70%, avoid overhead wetting, and space plants generously for airflow.',
        imageUrl: null,
      },
    ],
  },
  {
    id: 'crop-spinach',
    name: 'Spinach',
    scientificName: 'Spinacia oleracea',
    category: 'Leafy Greens',
    phMin: 5.5,
    phMax: 6.6,
    ecMin: 1.0,
    ecMax: 1.8,
    cfMin: 10,
    cfMax: 18,
    ppm500Min: 500,
    ppm500Max: 900,
    ppm700Min: 700,
    ppm700Max: 1260,
    isCustomCalculations: false,
    tempMinC: 13,
    tempMaxC: 20,
    lightRequirement: '10 - 12 hours/day (12 - 14 DLI)',
    growthTips: 'Highly sensitive to root heat; keep reservoir < 20°C. High oxygenation is critical to prevent Pythium root rot.',
    imageUrl: null,
    issues: [
      {
        title: 'Pythium Root Rot',
        causeDescription: 'Warm nutrient solution (above 21°C) depletes dissolved oxygen, allowing Pythium zoospores to infect and decay root tips.',
        resolutionDescription: 'Add chilling to hold solution at 16-18°C, maximize aeration via air stones/venturi, and apply beneficial microorganisms or hypochlorous acid.',
        imageUrl: null,
      },
    ],
  },
  {
    id: 'crop-tomato',
    name: 'Tomato (Fruiting)',
    scientificName: 'Solanum lycopersicum',
    category: 'Fruiting',
    phMin: 5.8,
    phMax: 6.5,
    ecMin: 2.0,
    ecMax: 3.5,
    cfMin: 20,
    cfMax: 35,
    ppm500Min: 1000,
    ppm500Max: 1750,
    ppm700Min: 1400,
    ppm700Max: 2450,
    isCustomCalculations: false,
    tempMinC: 18,
    tempMaxC: 27,
    lightRequirement: '14 - 18 hours/day (25 - 30 DLI)',
    growthTips: 'Heavy feeder. Higher potassium during fruit set. Prune suckers regularly to maintain single/double leader growth.',
    imageUrl: null,
    issues: [
      {
        title: 'Blossom End Rot',
        causeDescription: 'Localized calcium deficiency in expanding fruit tissue caused by erratic irrigation, high EC spikes, or low transpiration.',
        resolutionDescription: 'Stabilize rootzone moisture, ensure calcium levels are 150-200 ppm, and lower EC during severe heat spells.',
        imageUrl: null,
      },
      {
        title: 'Magnesium Deficiency (Interveinal Chlorosis)',
        causeDescription: 'High potassium or ammonium competition in nutrient bath inhibits magnesium absorption in mature lower leaves.',
        resolutionDescription: 'Supplement magnesium sulfate (Epsom salt) at 1-2 grams per gallon, or perform a foliar spray at 0.5% concentration.',
        imageUrl: null,
      },
    ],
  },
  {
    id: 'crop-bell-pepper',
    name: 'Bell Pepper',
    scientificName: 'Capsicum annuum',
    category: 'Fruiting',
    phMin: 5.8,
    phMax: 6.5,
    ecMin: 1.8,
    ecMax: 2.6,
    cfMin: 18,
    cfMax: 26,
    ppm500Min: 900,
    ppm500Max: 1300,
    ppm700Min: 1260,
    ppm700Max: 1820,
    isCustomCalculations: false,
    tempMinC: 20,
    tempMaxC: 28,
    lightRequirement: '14 - 16 hours/day (20 - 25 DLI)',
    growthTips: 'Sensitive to calcium deficiency (blossom end rot). Maintain steady root zone temperatures and avoid water stress during fruit set.',
    imageUrl: null,
    issues: [
      {
        title: 'Blossom Drop',
        causeDescription: 'Temperatures consistently exceeding 32°C day or dropping below 15°C night prevent viable pollination.',
        resolutionDescription: 'Manage greenhouse shading, improve evaporative cooling, and gently vibrate flower clusters to assist pollen transfer.',
        imageUrl: null,
      },
      {
        title: 'Sunscald on Fruit',
        causeDescription: 'Direct exposure of intense sunlight on unshaded developing peppers due to excessive leaf pruning.',
        resolutionDescription: 'Maintain sufficient leaf canopy over the fruit clusters and provide 20-30% shade cloth during peak summer UV index.',
        imageUrl: null,
      },
    ],
  },
  {
    id: 'crop-strawberry',
    name: 'Strawberry',
    scientificName: 'Fragaria × ananassa',
    category: 'Fruiting',
    phMin: 5.5,
    phMax: 6.2,
    ecMin: 1.0,
    ecMax: 1.4,
    cfMin: 10,
    cfMax: 14,
    ppm500Min: 500,
    ppm500Max: 700,
    ppm700Min: 700,
    ppm700Max: 980,
    isCustomCalculations: false,
    tempMinC: 15,
    tempMaxC: 24,
    lightRequirement: '12 - 14 hours/day (15 - 20 DLI)',
    growthTips: 'Very low EC tolerance; easily damaged by salt buildup. Keep crowns above water level to prevent fungal crown rot.',
    imageUrl: null,
    issues: [
      {
        title: 'Crown Rot (Phytophthora)',
        causeDescription: 'Submerging the plant crown in nutrient film or stagnant water around base of plant encourages fungal colonization.',
        resolutionDescription: 'Plant crowns strictly above aggregate surface, maintain vigorous drainage, and keep solution temperatures below 20°C.',
        imageUrl: null,
      },
      {
        title: 'Salt Burn (Tip Necrosis)',
        causeDescription: 'EC rising above 1.5 mS/cm causes osmotic stress, resulting in dark, crispy edges on young foliage.',
        resolutionDescription: 'Flush root zone with fresh RO water, reduce baseline nutrient strength, and refresh reservoir weekly.',
        imageUrl: null,
      },
    ],
  },
  {
    id: 'crop-cucumber',
    name: 'Cucumber',
    scientificName: 'Cucumis sativus',
    category: 'Fruiting',
    phMin: 5.5,
    phMax: 6.0,
    ecMin: 1.7,
    ecMax: 2.5,
    cfMin: 17,
    cfMax: 25,
    ppm500Min: 850,
    ppm500Max: 1250,
    ppm700Min: 1190,
    ppm700Max: 1750,
    isCustomCalculations: false,
    tempMinC: 22,
    tempMaxC: 30,
    lightRequirement: '14 - 16 hours/day (20 - 25 DLI)',
    growthTips: 'Rapid water consumer; monitor reservoir depletion. Thrives in Dutch bucket or drip bato bucket setups with trellising.',
    imageUrl: null,
    issues: [
      {
        title: 'Powdery Mildew',
        causeDescription: 'High humidity combined with stagnant air enables Podosphaera xanthii white powdery fungal patches across leaf surfaces.',
        resolutionDescription: 'Apply potassium bicarbonate foliar wash, ensure continuous ventilation, and prune dying bottom leaves.',
        imageUrl: null,
      },
    ],
  },
  {
    id: 'crop-mint',
    name: 'Mint (Spearmint)',
    scientificName: 'Mentha spicata',
    category: 'Herbs',
    phMin: 5.5,
    phMax: 6.5,
    ecMin: 1.2,
    ecMax: 2.2,
    cfMin: 12,
    cfMax: 22,
    ppm500Min: 600,
    ppm500Max: 1100,
    ppm700Min: 840,
    ppm700Max: 1540,
    isCustomCalculations: false,
    tempMinC: 18,
    tempMaxC: 24,
    lightRequirement: '12 - 14 hours/day (12 - 16 DLI)',
    growthTips: 'Vigorous grower; benefits from frequent trimming. Spreads quickly via runners; best contained in isolated channels.',
    imageUrl: null,
    issues: [
      {
        title: 'Mint Rust (Puccinia menthae)',
        causeDescription: 'Airborne fungal spores spread under warm, humid conditions causing dusty orange and yellow pustules on leaf undersides.',
        resolutionDescription: 'Prune infected stems back to the crown, eliminate standing droplets on leaves, and ensure high airflow.',
        imageUrl: null,
      },
    ],
  },
];
