import { SearchTarget } from './location-search.models';

export const LOCAL_SEARCH_TARGETS: readonly SearchTarget[] = [
  {
    id: 'sollentuna-sjoberg-5-5',
    label: 'SOLLENTUNA SJÖBERG 5:5',
    kind: 'property',
    lonLat: [17.99449, 59.42447],
    zoom: 15,
    municipality: 'Sollentuna',
    source: 'local',
  },
  {
    id: 'stockholm',
    label: 'Stockholm',
    kind: 'place',
    lonLat: [18.0686, 59.3293],
    zoom: 12,
    municipality: 'Stockholm',
    source: 'local',
  },
  {
    id: 'goteborg',
    label: 'Göteborg',
    kind: 'place',
    lonLat: [11.9746, 57.7089],
    zoom: 12,
    municipality: 'Göteborg',
    source: 'local',
  },
  {
    id: 'malmo',
    label: 'Malmö',
    kind: 'place',
    lonLat: [13.0038, 55.605],
    zoom: 12,
    municipality: 'Malmö',
    source: 'local',
  },
  {
    id: 'uppsala',
    label: 'Uppsala',
    kind: 'place',
    lonLat: [17.6389, 59.8586],
    zoom: 12,
    municipality: 'Uppsala',
    source: 'local',
  },
];
