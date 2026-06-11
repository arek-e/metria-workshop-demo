import { formatTargetCoordinates } from './location-search-policy';
import { SearchTarget } from './location-search.models';

describe('location search policy', () => {
  it('formats selected target coordinates for the property panel', () => {
    const target: SearchTarget = {
      id: 'stockholm',
      label: 'Stockholm',
      kind: 'place',
      lonLat: { lon: 18.0686, lat: 59.3293 },
      zoom: 12,
      municipality: 'Stockholm',
      source: 'local',
    };

    expect(formatTargetCoordinates(target)).toBe('N 59.3293, E 18.0686 WGS84');
  });
});
