import { DecisionLayer, MapFeature, MapWorkbenchData, SearchTarget } from './geodata.models';

const layerCatalog: readonly DecisionLayer[] = [
  {
    id: 'property-boundaries',
    title: 'Fastighetsgränser',
    renderOrder: 10,
    restricted: false,
  },
  {
    id: 'climate-risk',
    title: 'Klimatriskzoner',
    renderOrder: 30,
    restricted: false,
  },
  {
    id: 'protected-imagery',
    title: 'Skyddad flygbild',
    renderOrder: 20,
    restricted: true,
    requiredRole: 'restricted-geodata',
  },
  {
    id: 'utility-corridors',
    title: 'Ledningsstråk',
    renderOrder: 40,
    restricted: true,
    requiredRole: 'restricted-geodata',
  },
];

const localSearchTargets: readonly SearchTarget[] = [
  {
    id: 'sollentuna-sjoberg-5-5',
    label: 'SOLLENTUNA SJÖBERG 5:5',
    kind: 'property',
    lonLat: { lon: 17.99449, lat: 59.42447 },
    zoom: 15,
    municipality: 'Sollentuna',
    source: 'local',
  },
  {
    id: 'stockholm',
    label: 'Stockholm',
    kind: 'place',
    lonLat: { lon: 18.0686, lat: 59.3293 },
    zoom: 12,
    municipality: 'Stockholm',
    source: 'local',
  },
  {
    id: 'goteborg',
    label: 'Göteborg',
    kind: 'place',
    lonLat: { lon: 11.9746, lat: 57.7089 },
    zoom: 12,
    municipality: 'Göteborg',
    source: 'local',
  },
  {
    id: 'malmo',
    label: 'Malmö',
    kind: 'place',
    lonLat: { lon: 13.0038, lat: 55.605 },
    zoom: 12,
    municipality: 'Malmö',
    source: 'local',
  },
  {
    id: 'uppsala',
    label: 'Uppsala',
    kind: 'place',
    lonLat: { lon: 17.6389, lat: 59.8586 },
    zoom: 12,
    municipality: 'Uppsala',
    source: 'local',
  },
];

const mapFeatures: readonly MapFeature[] = [
  {
    id: 'property-boundary',
    layerId: 'property-boundaries',
    geometryType: 'polygon',
    coordinates: [
      { lon: 17.9936, lat: 59.4249 },
      { lon: 17.9947, lat: 59.4251 },
      { lon: 17.9954, lat: 59.4245 },
      { lon: 17.9948, lat: 59.4239 },
      { lon: 17.9935, lat: 59.424 },
      { lon: 17.9936, lat: 59.4249 },
    ],
  },
  {
    id: 'climate-risk-heat',
    layerId: 'climate-risk',
    geometryType: 'polygon',
    coordinates: [
      { lon: 17.9899, lat: 59.4259 },
      { lon: 17.9962, lat: 59.4263 },
      { lon: 17.9991, lat: 59.4237 },
      { lon: 17.9951, lat: 59.4224 },
      { lon: 17.9902, lat: 59.4233 },
      { lon: 17.9899, lat: 59.4259 },
    ],
  },
  {
    id: 'climate-risk-flood',
    layerId: 'climate-risk',
    geometryType: 'polygon',
    coordinates: [
      { lon: 17.9887, lat: 59.4232 },
      { lon: 17.9935, lat: 59.4228 },
      { lon: 18, lat: 59.4223 },
      { lon: 17.9996, lat: 59.4216 },
      { lon: 17.9931, lat: 59.4221 },
      { lon: 17.9885, lat: 59.4225 },
      { lon: 17.9887, lat: 59.4232 },
    ],
  },
  {
    id: 'protected-imagery-extent',
    layerId: 'protected-imagery',
    geometryType: 'polygon',
    coordinates: [
      { lon: 17.9876, lat: 59.4267 },
      { lon: 18.0031, lat: 59.4259 },
      { lon: 18.0018, lat: 59.4201 },
      { lon: 17.9863, lat: 59.4209 },
      { lon: 17.9876, lat: 59.4267 },
    ],
  },
  {
    id: 'utility-corridor',
    layerId: 'utility-corridors',
    geometryType: 'line-string',
    coordinates: [
      { lon: 17.9879, lat: 59.4268 },
      { lon: 17.9921, lat: 59.4252 },
      { lon: 17.9961, lat: 59.4237 },
      { lon: 18.0017, lat: 59.4214 },
    ],
  },
];

export class GeodataRepository {
  getMapWorkbench(): MapWorkbenchData {
    return {
      layers: layerCatalog,
      defaultSelectedLayerIds: ['property-boundaries', 'climate-risk'],
      defaultSearchTarget: localSearchTargets[0],
      features: mapFeatures,
    };
  }

  listSearchTargets(): readonly SearchTarget[] {
    return localSearchTargets;
  }
}
