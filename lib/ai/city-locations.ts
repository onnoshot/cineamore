export interface CityLocation {
  /** Arid landscape descriptor for Scene 1 */
  s1: string;
  /** Paradise bloom context for Scene 2 */
  s2: string;
  /** Soft bokeh backdrop for Scene 3 */
  s3: string;
  /** Barely-visible background for Scene 4 */
  s4: string;
}

const LOCATIONS: Record<string, CityLocation> = {
  // ── TURKISH CITIES ──────────────────────────────────────────────────────
  istanbul: {
    s1: "on the sun-cracked banks of the Bosphorus, ancient Ottoman city walls and distant minarets shimmering in the heat haze on the horizon",
    s2: "the Paradise Garden materializes along the glittering Bosphorus shore, Galata Tower silhouetted against the emerald sky, tulips and roses blooming between ancient stone arches",
    s3: "the softly glowing Bosphorus Bridge reflecting golden light in the dreamy bokeh behind their faces",
    s4: "the faint silhouette of Istanbul's skyline — minarets and bridge towers — barely visible through the rose petals like a dream",
  },
  ankara: {
    s1: "across the dry Anatolian steppe, the imposing silhouette of Anıtkabir visible on the distant ridge under a harsh sun",
    s2: "the paradise blooms across Ankara's hills, Anıtkabir rising serenely above emerald gardens and cascading wildflowers",
    s3: "Ankara's hilltop skyline glowing warmly in the soft bokeh, city lights twinkling behind them",
    s4: "the gentle silhouette of Ankara's hills faintly glowing through the rose petals",
  },
  izmir: {
    s1: "on the parched Aegean hillside above Izmir Bay, the sun-bleached dock ruins fading into heat shimmer",
    s2: "the Eden garden blooms along Izmir's Kordon waterfront, the Aegean Sea turning brilliant emerald, Saat Kulesi rising through flowering bougainvillea",
    s3: "the Aegean Sea horizon and Izmir's Kordon promenade glowing in warm golden bokeh behind them",
    s4: "the Aegean coastline shimmering faintly through the rose petals",
  },
  antalya: {
    s1: "on the scorched limestone cliffs above Antalya's ancient harbour, the dry Mediterranean coast stretching into the haze",
    s2: "paradise erupts along the turquoise Mediterranean coast, Kaleiçi's ancient harbour walls draped in emerald vines and blossoms",
    s3: "the turquoise Mediterranean and ancient Kaleiçi harbour glowing in warm bokeh behind their faces",
    s4: "the Mediterranean coastline with ancient stone walls softly visible through the rose petals",
  },
  bursa: {
    s1: "on the dry foothills of Uludağ mountain, the ancient city walls bleached by the sun below",
    s2: "paradise blooms on Bursa's green slopes, the Grand Mosque's dome emerging through an explosion of emerald foliage and roses",
    s3: "Uludağ's misty silhouette and Bursa's city lights glowing softly in the bokeh",
    s4: "Uludağ mountain silhouette faintly visible through the rose petals in the distance",
  },
  eskişehir: {
    s1: "on the parched banks of the dried Porsuk stream, pale bridges arching over cracked earth in the harsh sun",
    s2: "paradise erupts along the Porsuk River, the colourful bridges now wreathed in emerald vines, flowers cascading from every lamppost",
    s3: "Eskişehir's charming colourful bridges reflected softly in warm bokeh",
    s4: "the faint glow of Porsuk River's bridges visible through the rose petals",
  },
  konya: {
    s1: "across the vast sun-baked Anatolian plain, the distant dome of Mevlana's shrine shimmering in the heat",
    s2: "the paradise blooms across Konya's golden plains, Mevlana's turquoise dome rising above a sea of roses and emerald grass",
    s3: "Mevlana's turquoise-domed shrine glowing ethereally in the warm golden bokeh",
    s4: "Mevlana's iconic dome barely visible like a jewel through the rose petals",
  },
  adana: {
    s1: "on the scorched banks of the Seyhan River, the ancient stone Taşköprü bridge crumbling in the summer heat",
    s2: "paradise erupts along the Seyhan River's banks, Taşköprü bridge now draped in flowering vines and lush greenery",
    s3: "the Seyhan River and Adana's Taşköprü bridge glowing warmly in the bokeh",
    s4: "the Seyhan River's gentle shimmer faintly visible through the rose petals",
  },
  trabzon: {
    s1: "on the dry coastal cliffs above the Black Sea, ancient Trabzon castle walls bleached under an unforgiving sun",
    s2: "paradise blooms along the Black Sea coast, Trabzon's hillside forests returning in an explosion of emerald green",
    s3: "the Black Sea horizon glowing with golden light in the soft bokeh behind them",
    s4: "the Black Sea coastline faintly shimmering through the rose petals",
  },
  bodrum: {
    s1: "on the sun-scorched limestone hills above Bodrum harbour, the ancient castle reflected in the dried seabed",
    s2: "paradise erupts around Bodrum Castle, the Aegean turning brilliant turquoise-green, bougainvillea cascading over white stone walls",
    s3: "Bodrum Castle and the glittering Aegean sea glowing softly in warm bokeh",
    s4: "Bodrum's white castle silhouette faintly visible through the rose petals",
  },
  // ── INTERNATIONAL ───────────────────────────────────────────────────────
  paris: {
    s1: "on the sun-baked banks of the dried Seine, the Eiffel Tower casting long shadows over cracked earth",
    s2: "paradise blooms along the Seine, the Eiffel Tower wreathed in emerald climbing roses, Parisian boulevards bursting with life",
    s3: "the Eiffel Tower glowing gold in the soft Parisian bokeh behind their faces",
    s4: "the Eiffel Tower's silhouette faintly twinkling through the rose petals",
  },
  london: {
    s1: "on the parched banks of the dried Thames, Tower Bridge rising dramatically against a blazing sky",
    s2: "paradise erupts along the Thames, Tower Bridge now draped in cascading emerald vines and blooming roses",
    s3: "Tower Bridge glowing warmly in the golden bokeh reflected in the Thames",
    s4: "Tower Bridge silhouette barely visible like a watercolour through the rose petals",
  },
  "new york": {
    s1: "on the cracked asphalt of a deserted Manhattan street, the Empire State Building casting a harsh shadow",
    s2: "paradise erupts across Central Park and beyond — skyscrapers draped in flowering vines, Manhattan reborn in emerald",
    s3: "the Manhattan skyline glowing in warm amber bokeh behind their faces",
    s4: "the New York skyline twinkling faintly through the rose petals",
  },
  tokyo: {
    s1: "on the sun-cracked streets of a deserted Tokyo, Mount Fuji shimmering faintly through the summer haze",
    s2: "paradise blooms across Tokyo, Mount Fuji emerging from an ocean of cherry blossoms and emerald gardens",
    s3: "Mount Fuji and Tokyo Tower glowing softly in the warm bokeh",
    s4: "Mount Fuji's silhouette barely visible through the rose petals like an ink painting",
  },
  dubai: {
    s1: "on the scorching desert dunes outside Dubai, the Burj Khalifa towering as a mirage in the searing heat",
    s2: "paradise erupts in the desert, the Burj Khalifa rising from an ocean of emerald palms and cascading roses",
    s3: "the Burj Khalifa glowing gold in the warm desert bokeh behind their faces",
    s4: "the Burj Khalifa silhouette faintly glowing through the rose petals",
  },
  rome: {
    s1: "on the parched Roman hills, the Colosseum's ancient arches bleached under a relentless Mediterranean sun",
    s2: "paradise erupts around the Colosseum, ancient stone walls draped in emerald vines and cascading roses",
    s3: "the Colosseum glowing in golden Roman light in the soft bokeh behind them",
    s4: "the Colosseum's silhouette faintly visible through the rose petals",
  },
  barcelona: {
    s1: "on the sun-scorched hills above Barcelona, Sagrada Família's spires shimmering in the heat haze",
    s2: "paradise blooms around Sagrada Família, its stone spires wreathed in flowering vines, the Mediterranean glittering emerald",
    s3: "Sagrada Família's spires and the Mediterranean horizon glowing in warm bokeh",
    s4: "Sagrada Família's spires faintly visible like a dream through the rose petals",
  },
};

// Normalize city string for lookup
function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .replace(/ı/g, "i").replace(/İ/g, "i")
    .replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ");
}

const DEFAULT_LOCATION: CityLocation = {
  s1: "on a vast sun-cracked arid landscape, distant mountains shimmering in the heat",
  s2: "the paradise materializes in a breathtaking landscape, ancient hills bursting into emerald life",
  s3: "a warm golden landscape glowing softly in the dreamy bokeh behind their faces",
  s4: "golden hills and glowing sky faintly visible through the rose petals",
};

export function getCityLocation(city?: string | null): CityLocation {
  if (!city) return DEFAULT_LOCATION;
  const key = normalizeCity(city);
  return LOCATIONS[key] ?? DEFAULT_LOCATION;
}
