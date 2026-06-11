import { buildStatusResponse } from '../system/status';
import { GeodataRepository } from './geodata.repository';
import { GeodataSearchService } from './geodata.search';

export const geodataSchema = `
  type ApiStatus {
    status: String!
    service: String!
    version: String!
  }

  type DecisionLayer {
    id: ID!
    title: String!
    renderOrder: Int!
    restricted: Boolean!
    requiredRole: String
  }

  type Coordinate {
    lon: Float!
    lat: Float!
  }

  type SearchTarget {
    id: ID!
    label: String!
    kind: String!
    lonLat: Coordinate!
    zoom: Int!
    municipality: String
    source: String!
  }

  type MapFeature {
    id: ID!
    layerId: ID!
    geometryType: String!
    coordinates: [Coordinate!]!
  }

  type MapWorkbench {
    layers: [DecisionLayer!]!
    defaultSelectedLayerIds: [ID!]!
    defaultSearchTarget: SearchTarget!
    features: [MapFeature!]!
  }

  type Query {
    status: ApiStatus!
    mapWorkbench: MapWorkbench!
    searchTargets(query: String!, limit: Int = 5): [SearchTarget!]!
  }
`;

export function buildGeodataResolvers(
  repository = new GeodataRepository(),
  searchService = new GeodataSearchService(repository),
) {
  return {
    Query: {
      status: () => buildStatusResponse(),
      mapWorkbench: () => repository.getMapWorkbench(),
      searchTargets: (_root: unknown, args: { query: string; limit?: number }) =>
        searchService.searchTargets(args.query, args.limit ?? 5),
    },
  };
}
