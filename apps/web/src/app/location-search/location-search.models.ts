export type SearchTargetKind = 'property' | 'place' | 'address';

export interface SearchTarget {
  id: string;
  label: string;
  kind: SearchTargetKind;
  lonLat: readonly [number, number];
  zoom: number;
  municipality?: string;
  source: 'local' | 'nominatim';
}
