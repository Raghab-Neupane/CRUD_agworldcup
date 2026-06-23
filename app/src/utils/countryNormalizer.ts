export const countryMapping: Record<string, string> = {
  "Algeria": "algeria",
  "Argentina": "argentina",
  "Australia": "australia",
  "Austria": "austria",
  "Belgium": "belgium",
  "Bosnia and Herzegovina": "bosnia and herzegovina",
  "Brazil": "brazil",
  "Cabo Verde": "cape verde",
  "Canada": "canada",
  "Colombia": "colombia",
  "Congo DR": "dr congo",
  "Cote d'Ivoire": "ivory coast",
  "Croatia": "croatia",
  "Curaçao": "curacao",
  "Czechia": "czechia",
  "Ecuador": "ecuador",
  "Egypt": "egypt",
  "England": "england",
  "France": "france",
  "Germany": "germany",
  "Ghana": "ghana",
  "Haiti": "haiti",
  "Iran": "iran",
  "Iraq": "iraq",
  "Japan": "japan",
  "Jordan": "jordan",
  "South Korea": "south korea",
  "Mexico": "mexico",
  "Morocco": "morocco",
  "Netherlands": "netherlands",
  "New Zealand": "new zealand",
  "Norway": "norway",
  "Panama": "panama",
  "Paraguay": "paraguay",
  "Portugal": "portugal",
  "Qatar": "qatar",
  "Saudi Arabia": "saudi arabia",
  "Scotland": "scotland",
  "Senegal": "senegal",
  "South Africa": "south africa",
  "Spain": "spain",
  "Sweden": "sweden",
  "Switzerland": "switzerland",
  "Tunisia": "tunisia",
  "Turkey": "turkiye",
  "USA": "usa",
  "Uruguay": "uruguay",
  "Uzbekistan": "uzbekistan"
};

/**
 * Normalizes a country display name to its canonical backend name.
 * If the country does not exist in the mapping, falls back to its lowercase value.
 */
export function normalizeCountry(countryName: string | null | undefined): string {
  if (!countryName) return "";
  const trimmed = countryName.trim();
  return countryMapping[trimmed] || trimmed.toLowerCase();
}
