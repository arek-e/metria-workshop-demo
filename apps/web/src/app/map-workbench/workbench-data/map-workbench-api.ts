import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { GraphqlClient } from '../../shared/api/graphql-client';
import { DecisionLayer, UserRole } from '../layers/layer-decision.models';
import {
  SearchTarget,
  SearchTargetKind,
  SearchTargetSource,
} from '../search/location-search.models';
import { MapFeature, MapGeometryType, MapWorkbenchData } from './map-workbench.models';

interface MapWorkbenchQueryData {
  readonly mapWorkbench: MapWorkbenchDto;
}

interface SearchTargetsQueryData {
  readonly searchTargets: readonly SearchTargetDto[];
}

interface DecisionLayerDto {
  readonly id: string;
  readonly title: string;
  readonly renderOrder: number;
  readonly restricted: boolean;
  readonly requiredRole: UserRole | null;
}

interface SearchTargetDto {
  readonly id: string;
  readonly label: string;
  readonly kind: SearchTargetKind;
  readonly lonLat: {
    readonly lon: number;
    readonly lat: number;
  };
  readonly zoom: number;
  readonly municipality: string | null;
  readonly source: SearchTargetSource;
}

interface MapFeatureDto {
  readonly id: string;
  readonly layerId: string;
  readonly geometryType: MapGeometryType;
  readonly coordinates: readonly {
    readonly lon: number;
    readonly lat: number;
  }[];
}

interface MapWorkbenchDto {
  readonly layers: readonly DecisionLayerDto[];
  readonly defaultSelectedLayerIds: readonly string[];
  readonly defaultSearchTarget: SearchTargetDto;
  readonly features: readonly MapFeatureDto[];
}

const MAP_WORKBENCH_QUERY = `
  query MapWorkbench {
    mapWorkbench {
      defaultSelectedLayerIds
      defaultSearchTarget {
        id
        label
        kind
        lonLat {
          lon
          lat
        }
        zoom
        municipality
        source
      }
      layers {
        id
        title
        renderOrder
        restricted
        requiredRole
      }
      features {
        id
        layerId
        geometryType
        coordinates {
          lon
          lat
        }
      }
    }
  }
`;

const SEARCH_TARGETS_QUERY = `
  query SearchTargets($query: String!, $limit: Int!) {
    searchTargets(query: $query, limit: $limit) {
      id
      label
      kind
      lonLat {
        lon
        lat
      }
      zoom
      municipality
      source
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class MapWorkbenchApi {
  private readonly graphql = inject(GraphqlClient);

  loadWorkbench(): Observable<MapWorkbenchData> {
    return this.graphql
      .query<MapWorkbenchQueryData>(MAP_WORKBENCH_QUERY)
      .pipe(map((response) => toMapWorkbenchData(response.mapWorkbench)));
  }

  searchTargets(query: string, limit = 5): Observable<readonly SearchTarget[]> {
    return this.graphql
      .query<SearchTargetsQueryData>(SEARCH_TARGETS_QUERY, { query, limit })
      .pipe(map((response) => response.searchTargets.map(toSearchTarget)));
  }
}

function toMapWorkbenchData(dto: MapWorkbenchDto): MapWorkbenchData {
  return {
    layers: dto.layers.map(toDecisionLayer),
    defaultSelectedLayerIds: dto.defaultSelectedLayerIds,
    defaultSearchTarget: toSearchTarget(dto.defaultSearchTarget),
    features: dto.features.map(toMapFeature),
  };
}

function toDecisionLayer(dto: DecisionLayerDto): DecisionLayer {
  return {
    id: dto.id,
    title: dto.title,
    renderOrder: dto.renderOrder,
    restricted: dto.restricted,
    requiredRole: dto.requiredRole ?? undefined,
  };
}

function toSearchTarget(dto: SearchTargetDto): SearchTarget {
  return {
    id: dto.id,
    label: dto.label,
    kind: dto.kind,
    lonLat: dto.lonLat,
    zoom: dto.zoom,
    municipality: dto.municipality ?? undefined,
    source: dto.source,
  };
}

function toMapFeature(dto: MapFeatureDto): MapFeature {
  return {
    id: dto.id,
    layerId: dto.layerId,
    geometryType: dto.geometryType,
    coordinates: dto.coordinates,
  };
}
