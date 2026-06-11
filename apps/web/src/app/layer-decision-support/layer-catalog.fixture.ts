import { DecisionLayer } from './layer-decision-support.models';

export const LAYER_CATALOG: readonly DecisionLayer[] = [
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
