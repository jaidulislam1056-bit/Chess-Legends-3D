export interface CountryConfig {
  id: string;
  name: string;
  code: string;
  flag: string;
  primaryColor: string;    // Main uniform / armor color
  secondaryColor: string;  // Secondary trim / shield / cape color
  accentColor: string;     // Glowing or bright emblem highlight
  metalColor: string;      // Armor plate / weapon metallic tint
  armyTitle: string;       // Thematic legion title
  specialty: string;       // Visual motif description
}

export const COUNTRIES: CountryConfig[] = [
  {
    id: 'bangladesh',
    name: 'Bangladesh',
    code: 'BD',
    flag: '🇧🇩',
    primaryColor: '#006a4e',
    secondaryColor: '#f42a41',
    accentColor: '#fbbf24',
    metalColor: '#d4af37',
    armyTitle: 'Bengal Royal Vanguard',
    specialty: 'Emerald & Crimson Sun Armor with Golden Crest'
  },
  {
    id: 'india',
    name: 'India',
    code: 'IN',
    flag: '🇮🇳',
    primaryColor: '#ff7722',
    secondaryColor: '#138808',
    accentColor: '#3b82f6',
    metalColor: '#e5c158',
    armyTitle: 'Saffron Imperial Guard',
    specialty: 'Saffron & Royal Chakra Plate with Emerald Trim'
  },
  {
    id: 'pakistan',
    name: 'Pakistan',
    code: 'PK',
    flag: '🇵🇰',
    primaryColor: '#01411c',
    secondaryColor: '#f8fafc',
    accentColor: '#10b981',
    metalColor: '#cbd5e1',
    armyTitle: 'Crescent Star Phalanx',
    specialty: 'Deep Pine Green & Silver Star-Crested Mail'
  },
  {
    id: 'usa',
    name: 'USA',
    code: 'US',
    flag: '🇺🇸',
    primaryColor: '#1e3a8a',
    secondaryColor: '#dc2626',
    accentColor: '#f8fafc',
    metalColor: '#94a3b8',
    armyTitle: 'Stars & Stripes Legion',
    specialty: 'Cobalt Blue & Crimson Striped Vanguard Plate'
  },
  {
    id: 'uk',
    name: 'UK',
    code: 'GB',
    flag: '🇬🇧',
    primaryColor: '#be123c',
    secondaryColor: '#1d4ed8',
    accentColor: '#f8fafc',
    metalColor: '#f59e0b',
    armyTitle: 'Crown Knights of Albion',
    specialty: 'Royal Crimson Tunics & Union Cross Shields'
  },
  {
    id: 'brazil',
    name: 'Brazil',
    code: 'BR',
    flag: '🇧🇷',
    primaryColor: '#009c3b',
    secondaryColor: '#ffdf00',
    accentColor: '#002776',
    metalColor: '#eab308',
    armyTitle: 'Amazonian Sun Order',
    specialty: 'Vibrant Emerald & Golden Diamond Battle Gear'
  },
  {
    id: 'argentina',
    name: 'Argentina',
    code: 'AR',
    flag: '🇦🇷',
    primaryColor: '#38bdf8',
    secondaryColor: '#f8fafc',
    accentColor: '#f59e0b',
    metalColor: '#e2e8f0',
    armyTitle: 'Sol de Mayo Cavaliers',
    specialty: 'Celeste Sky & Alabaster Armor with Sun Emblem'
  },
  {
    id: 'germany',
    name: 'Germany',
    code: 'DE',
    flag: '🇩🇪',
    primaryColor: '#27272a',
    secondaryColor: '#dc2626',
    accentColor: '#eab308',
    metalColor: '#a1a1aa',
    armyTitle: 'Iron Teutonic Guard',
    specialty: 'Obsidian Steel, Crimson & Imperial Gold Trim'
  },
  {
    id: 'france',
    name: 'France',
    code: 'FR',
    flag: '🇫🇷',
    primaryColor: '#1d4ed8',
    secondaryColor: '#ef4444',
    accentColor: '#f8fafc',
    metalColor: '#fcd34d',
    armyTitle: 'Royal Fleur-de-Lis Brigade',
    specialty: 'Sapphire Blue & Gilded Lily Cavalry Plate'
  },
  {
    id: 'japan',
    name: 'Japan',
    code: 'JP',
    flag: '🇯🇵',
    primaryColor: '#991b1b',
    secondaryColor: '#f8fafc',
    accentColor: '#ef4444',
    metalColor: '#d4af37',
    armyTitle: 'Rising Sun Samurai Clan',
    specialty: 'Lacquered Crimson & Pure White Sun Armor'
  },
  {
    id: 'china',
    name: 'China',
    code: 'CN',
    flag: '🇨🇳',
    primaryColor: '#dc2626',
    secondaryColor: '#fbbf24',
    accentColor: '#fef08a',
    metalColor: '#f59e0b',
    armyTitle: 'Celestial Dragon Dynasty',
    specialty: 'Imperial Vermilion & Five-Star Golden Scale'
  },
  {
    id: 'russia',
    name: 'Russia',
    code: 'RU',
    flag: '🇷🇺',
    primaryColor: '#1e40af',
    secondaryColor: '#dc2626',
    accentColor: '#f8fafc',
    metalColor: '#cbd5e1',
    armyTitle: 'Northern Frost Paladins',
    specialty: 'Deep Azure, Crimson & Silver Bear Crest'
  },
  {
    id: 'nepal',
    name: 'Nepal',
    code: 'NP',
    flag: '🇳🇵',
    primaryColor: '#be123c',
    secondaryColor: '#1e3a8a',
    accentColor: '#f8fafc',
    metalColor: '#fbbf24',
    armyTitle: 'Himalayan Gurkha Sentinels',
    specialty: 'Crimson Pennant & Deep Mountain Blue Plate'
  },
  {
    id: 'saudi_arabia',
    name: 'Saudi Arabia',
    code: 'SA',
    flag: '🇸🇦',
    primaryColor: '#047857',
    secondaryColor: '#f8fafc',
    accentColor: '#fbbf24',
    metalColor: '#d4af37',
    armyTitle: 'Desert Falcon Swordsmen',
    specialty: 'Oasis Green & Damascus Gold Scimitar Trim'
  },
  {
    id: 'turkey',
    name: 'Turkey',
    code: 'TR',
    flag: '🇹🇷',
    primaryColor: '#e11d48',
    secondaryColor: '#f8fafc',
    accentColor: '#fbbf24',
    metalColor: '#e2e8f0',
    armyTitle: 'Anatolian Star Vanguard',
    specialty: 'Ruby Red & Silver Crescent Battle Cuirass'
  },
  {
    id: 'spain',
    name: 'Spain',
    code: 'ES',
    flag: '🇪🇸',
    primaryColor: '#b91c1c',
    secondaryColor: '#f59e0b',
    accentColor: '#fef08a',
    metalColor: '#eab308',
    armyTitle: 'Castilian Crown Tercios',
    specialty: 'Crimson & Royal Gold Conquistador Plate'
  },
  {
    id: 'portugal',
    name: 'Portugal',
    code: 'PT',
    flag: '🇵🇹',
    primaryColor: '#047857',
    secondaryColor: '#dc2626',
    accentColor: '#fbbf24',
    metalColor: '#d4af37',
    armyTitle: 'Lusitanian Navigator Order',
    specialty: 'Maritime Forest Green & Crimson Armillary Gold'
  },
  {
    id: 'italy',
    name: 'Italy',
    code: 'IT',
    flag: '🇮🇹',
    primaryColor: '#15803d',
    secondaryColor: '#dc2626',
    accentColor: '#f8fafc',
    metalColor: '#e5c158',
    armyTitle: 'Roman Renaissance Legion',
    specialty: 'Tricolor Emerald, Alabaster & Ruby Centurion Armor'
  },
  {
    id: 'canada',
    name: 'Canada',
    code: 'CA',
    flag: '🇨🇦',
    primaryColor: '#dc2626',
    secondaryColor: '#f8fafc',
    accentColor: '#fca5a5',
    metalColor: '#e2e8f0',
    armyTitle: 'Maple Shield Wardens',
    specialty: 'Scarlet Red & Snow-White Maple Crest Armor'
  },
  {
    id: 'australia',
    name: 'Australia',
    code: 'AU',
    flag: '🇦🇺',
    primaryColor: '#065f46',
    secondaryColor: '#f59e0b',
    accentColor: '#1d4ed8',
    metalColor: '#fbbf24',
    armyTitle: 'Southern Cross Outriders',
    specialty: 'Green & Gold Wattle Armor with Star Studs'
  },
  {
    id: 'south_korea',
    name: 'South Korea',
    code: 'KR',
    flag: '🇰🇷',
    primaryColor: '#f8fafc',
    secondaryColor: '#1d4ed8',
    accentColor: '#e11d48',
    metalColor: '#94a3b8',
    armyTitle: 'Taegeuk Royal Hwarang',
    specialty: 'White Silk, Sapphire & Crimson Harmony Plate'
  },
  {
    id: 'indonesia',
    name: 'Indonesia',
    code: 'ID',
    flag: '🇮🇩',
    primaryColor: '#dc2626',
    secondaryColor: '#f8fafc',
    accentColor: '#fbbf24',
    metalColor: '#d4af37',
    armyTitle: 'Garuda Archipelago Knights',
    specialty: 'Bold Red & Pure White with Golden Garuda Wings'
  },
  {
    id: 'malaysia',
    name: 'Malaysia',
    code: 'MY',
    flag: '🇲🇾',
    primaryColor: '#1e3a8a',
    secondaryColor: '#eab308',
    accentColor: '#dc2626',
    metalColor: '#fbbf24',
    armyTitle: 'Malayan Tiger Stripes',
    specialty: 'Royal Indigo, Golden Crescent & Crimson Stripes'
  },
  {
    id: 'thailand',
    name: 'Thailand',
    code: 'TH',
    flag: '🇹🇭',
    primaryColor: '#1e3a8a',
    secondaryColor: '#b91c1c',
    accentColor: '#fbbf24',
    metalColor: '#d4af37',
    armyTitle: 'Siam Royal War Elephants',
    specialty: 'Deep Navy, Crimson & Gilded Spire Crown'
  },
  {
    id: 'egypt',
    name: 'Egypt',
    code: 'EG',
    flag: '🇪🇬',
    primaryColor: '#b91c1c',
    secondaryColor: '#18181b',
    accentColor: '#fbbf24',
    metalColor: '#eab308',
    armyTitle: 'Pharaoh Golden Eagle Guard',
    specialty: 'Crimson, Obsidian & Saladin Golden Eagle Plate'
  },
  {
    id: 'mexico',
    name: 'Mexico',
    code: 'MX',
    flag: '🇲🇽',
    primaryColor: '#047857',
    secondaryColor: '#dc2626',
    accentColor: '#f59e0b',
    metalColor: '#d4af37',
    armyTitle: 'Aztec Eagle Cavaliers',
    specialty: 'Jade Green, Crimson & Bronze Eagle Crest'
  },
  {
    id: 'afghanistan',
    name: 'Afghanistan',
    code: 'AF',
    flag: '🇦🇫',
    primaryColor: '#27272a',
    secondaryColor: '#dc2626',
    accentColor: '#16a34a',
    metalColor: '#d4af37',
    armyTitle: 'Hindu Kush Mountain Citadel',
    specialty: 'Obsidian, Ruby & Emerald Mountain Forged Armor'
  },
  {
    id: 'sri_lanka',
    name: 'Sri Lanka',
    code: 'LK',
    flag: '🇱🇰',
    primaryColor: '#881337',
    secondaryColor: '#f59e0b',
    accentColor: '#ea580c',
    metalColor: '#fbbf24',
    armyTitle: 'Golden Lion Sword Guard',
    specialty: 'Royal Maroon & Golden Sword-Bearing Lion Plate'
  },
  {
    id: 'iran',
    name: 'Iran',
    code: 'IR',
    flag: '🇮🇷',
    primaryColor: '#15803d',
    secondaryColor: '#dc2626',
    accentColor: '#f8fafc',
    metalColor: '#d4af37',
    armyTitle: 'Persian Immortal Vanguard',
    specialty: 'Emerald, Alabaster & Ruby Immortal Scale Armor'
  },
  {
    id: 'ukraine',
    name: 'Ukraine',
    code: 'UA',
    flag: '🇺🇦',
    primaryColor: '#0284c7',
    secondaryColor: '#eab308',
    accentColor: '#fef08a',
    metalColor: '#cbd5e1',
    armyTitle: 'Tryzub Golden Steppe Knights',
    specialty: 'Azure Sky & Golden Wheat Trident Plate'
  },
];

export function getCountryById(id: string): CountryConfig {
  return COUNTRIES.find((c) => c.id === id) || COUNTRIES[0];
}
