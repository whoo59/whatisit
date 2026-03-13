export const CATEGORIES = [
  {
    id: 'geography',
    emoji: '🌍',
    name: 'World Geography',
    description: 'Iconic landscapes, natural wonders & famous landmarks',
    color: '#10b981',
    prompt: `Generate exactly {count} diverse real-world geographic locations from different continents. Mix famous landmarks with less obvious natural wonders, UNESCO sites, and iconic landscapes. Include variety: mountains, lakes, deserts, coasts, forests, valleys.

For wikiTitle, provide the exact Wikipedia article title (e.g. 'Machu_Picchu', 'Lake_Baikal', 'Antelope_Canyon').

Each item must have a "difficulty" field: 1 = famous/easy, 2 = moderate, 3 = obscure/hard (used for display only).`
  },
  {
    id: 'animals',
    emoji: '🦁',
    name: 'Wild Animals',
    description: 'Rare, exotic & incredible creatures from around the world',
    color: '#f59e0b',
    prompt: `Generate exactly {count} fascinating wild animals — include rare, exotic, and visually striking species. Mix well-known (snow leopard, okapi) with genuinely obscure ones (saiga antelope, pangolin, axolotl, fossa). Include animals from different continents and habitats.

For wikiTitle, provide the exact Wikipedia article title (e.g. 'Snow_leopard', 'Pangolin', 'Axolotl').

Each item must have a "difficulty" field: 1 = common animal, 2 = less known, 3 = very rare/obscure (used for display only).`
  },
  {
    id: 'deepsea',
    emoji: '🦑',
    name: 'Deep Sea Creatures',
    description: 'The alien world beneath the ocean surface',
    color: '#3b82f6',
    prompt: `Generate exactly {count} deep sea and ocean creatures — the weirder the better. Include bioluminescent species, bizarre adaptations, giant creatures. Examples: anglerfish, mantis shrimp, mimic octopus, vampire squid, giant isopod, barreleye fish, goblin shark, giant oarfish.

For wikiTitle, provide the exact Wikipedia article title (e.g. 'Anglerfish', 'Mantis_shrimp', 'Giant_isopod').

Each item must have a "difficulty" field: 1 = well known sea creature, 2 = moderately known, 3 = very obscure deep sea (used for display only).`
  },
  {
    id: 'cities',
    emoji: '🏙️',
    name: 'City Skylines',
    description: 'Iconic cityscapes from every corner of the globe',
    color: '#8b5cf6',
    prompt: `Generate exactly {count} iconic city skylines or distinctive urban scenes from around the world. Mix mega-cities (Tokyo, NYC, Dubai) with less obvious ones (Tbilisi, Cartagena, Bergen, Chefchaouen). Include variety by continent and city type.

For wikiTitle, provide the exact Wikipedia article title for the city (e.g. 'Tokyo', 'Bergen', 'Cartagena,_Colombia').

Each item must have a "difficulty" field: 1 = instantly recognizable city, 2 = known but not obvious, 3 = obscure city (used for display only).`
  },
  {
    id: 'extreme',
    emoji: '🌋',
    name: 'Extreme Nature',
    description: 'Volcanoes, canyons, glaciers & Earth\'s most dramatic places',
    color: '#ef4444',
    prompt: `Generate exactly {count} extreme natural phenomena and dramatic landscapes — active volcanoes, massive canyons, glaciers, geysers, unusual geological formations. Examples: Danakil Depression, Kawah Ijen, Fly Geyser, Door to Hell, Socotra Island, Moeraki Boulders, Wave Rock.

For wikiTitle, provide the exact Wikipedia article title (e.g. 'Danakil_Depression', 'Kawah_Ijen', 'Fly_Geyser').

Each item must have a "difficulty" field: 1 = famous landmark, 2 = known to enthusiasts, 3 = very obscure (used for display only).`
  },
  {
    id: 'food',
    emoji: '🍜',
    name: 'World Foods',
    description: 'Guess the country from its most iconic dishes',
    color: '#f97316',
    prompt: `Generate exactly {count} iconic dishes or food scenes from different countries. Each should be visually distinctive and strongly associated with one country. Do NOT include sushi, pizza, or hamburgers — they are overused. Prioritize surprising and lesser-known dishes: injera (Ethiopia), khachapuri (Georgia), ceviche (Peru), bún bò Huế (Vietnam), plov (Uzbekistan), mole (Mexico), fufu (Ghana), mansaf (Jordan), rendang (Indonesia).

For wikiTitle, provide the exact Wikipedia article title for the dish (e.g. 'Injera', 'Khachapuri', 'Ceviche').

Each item must have a "difficulty" field: 1 = very famous dish everyone knows, 2 = foodies know it, 3 = very regional/obscure (used for display only).`
  },
  {
    id: 'babies',
    emoji: '👶',
    name: 'Baby Animals',
    description: 'The cutest creatures on Earth — guess what they are!',
    color: '#ec4899',
    prompt: `Generate exactly {count} baby animals — make them as cute and varied as possible. Include both common and exotic species as babies/juveniles. Examples: baby elephant, baby red panda, baby hedgehog, baby owl, baby hippo, baby seal, baby chameleon, baby polar bear.

For wikiTitle, provide the Wikipedia article title for the species (e.g. 'Red_panda', 'African_elephant', 'Hedgehog').

Each item must have a "difficulty" field: 1 = common baby animal, 2 = less common, 3 = very exotic baby (used for display only).`
  },
  {
    id: 'ruins',
    emoji: '🏛️',
    name: 'Ancient Ruins',
    description: 'Lost cities & ancient wonders from every civilization',
    color: '#d97706',
    prompt: `Generate exactly {count} ancient ruins and archaeological sites from different civilizations and continents. Mix famous (Petra, Angkor Wat, Chichen Itza) with genuinely obscure (Derinkuyu, Göbekli Tepe, Sigiriya, Sacsayhuamán, Leptis Magna).

For wikiTitle, provide the exact Wikipedia article title (e.g. 'Petra', 'Angkor_Wat', 'Göbekli_Tepe').

Each item must have a "difficulty" field: 1 = world famous ruins, 2 = known to history buffs, 3 = very obscure site (used for display only).`
  }
];

export const getCategoryById = (id) => CATEGORIES.find(c => c.id === id);
