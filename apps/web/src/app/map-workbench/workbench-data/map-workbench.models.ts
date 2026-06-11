import { DecisionLayer } from '../layers/layer-decision.models';
import { Coordinate, SearchTarget } from '../search/location-search.models';

export type MapGeometryType = 'polygon' | 'line-string';

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
