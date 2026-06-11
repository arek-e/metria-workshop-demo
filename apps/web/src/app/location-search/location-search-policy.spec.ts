import { findLocalSearchTarget, formatTargetCoordinates } from './location-search-policy';

describe('location search policy', () => {
  it('finds Stockholm from a plain text query', () => {
    const target = findLocalSearchTarget('stockholm');

    expect(target?.label).toBe('Stockholm');
    expect(target?.lonLat).toEqual([18.0686, 59.3293]);
  });

  it('matches Swedish place names without requiring accents', () => {
    expect(findLocalSearchTarget('goteborg')?.label).toBe('Göteborg');
    expect(findLocalSearchTarget('malmo')?.label).toBe('Malmö');
    expect(findLocalSearchTarget('sjoberg')?.label).toBe('SOLLENTUNA SJÖBERG 5:5');
  });

  it('formats selected target coordinates for the property panel', () => {
    const target = findLocalSearchTarget('Stockholm');

    expect(target ? formatTargetCoordinates(target) : undefined).toBe('N 59.3293, E 18.0686 WGS84');
  });
});
