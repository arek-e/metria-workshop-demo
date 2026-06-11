import { SearchTarget } from './location-search.models';

export function formatTargetCoordinates(target: SearchTarget): string {
  return `N ${target.lonLat.lat.toFixed(4)}, E ${target.lonLat.lon.toFixed(4)} WGS84`;
}
