import { LOCAL_SEARCH_TARGETS } from './location-search.fixture';
import { SearchTarget } from './location-search.models';

export function findLocalSearchTarget(query: string): SearchTarget | undefined {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return undefined;
  }

  return LOCAL_SEARCH_TARGETS.find((target) =>
    normalizeSearchText(`${target.label} ${target.municipality ?? ''}`).includes(normalizedQuery),
  );
}

export function formatTargetCoordinates(target: SearchTarget): string {
  return `N ${target.lonLat[1].toFixed(4)}, E ${target.lonLat[0].toFixed(4)} WGS84`;
}

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('sv-SE')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');
}
