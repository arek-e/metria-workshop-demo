export type SearchTargetKind = 'property' | 'place' | 'address';
export type SearchTargetSource = 'local' | 'nominatim';

export interface Coordinate {
  readonly lon: number;
  readonly lat: number;
}

export interface SearchTarget {
  id: string;
  label: string;
  kind: SearchTargetKind;
  lonLat: Coordinate;
  zoom: number;
  municipality?: string;
  source: SearchTargetSource;
}
