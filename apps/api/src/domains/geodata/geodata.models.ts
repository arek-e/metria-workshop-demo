export type UserRole = 'case-worker' | 'restricted-geodata' | 'exporter';
export type SearchTargetKind = 'property' | 'place' | 'address';
export type SearchTargetSource = 'local' | 'nominatim';
export type MapGeometryType = 'polygon' | 'line-string';

export interface DecisionLayer {
  readonly id: string;
  readonly title: string;
  readonly renderOrder: number;
  readonly restricted: boolean;
  readonly requiredRole?: UserRole;
}

export interface Coordinate {
  readonly lon: number;
  readonly lat: number;
}

export interface SearchTarget {
  readonly id: string;
  readonly label: string;
  readonly kind: SearchTargetKind;
  readonly lonLat: Coordinate;
  readonly zoom: number;
  readonly municipality?: string;
  readonly source: SearchTargetSource;
}

export interface MapFeature {
  readonly id: string;
  readonly layerId: string;
  readonly geometryType: MapGeometryType;
  readonly coordinates: readonly Coordinate[];
}

export interface MapWorkbenchData {
  readonly layers: readonly DecisionLayer[];
  readonly defaultSelectedLayerIds: readonly string[];
  readonly defaultSearchTarget: SearchTarget;
  readonly features: readonly MapFeature[];
}
