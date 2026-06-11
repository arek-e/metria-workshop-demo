import { buildLayerDecisionView, nextSelectedLayerIds } from './layer-access-policy';
import { DecisionLayer } from './layer-decision.models';

const layerCatalog: readonly DecisionLayer[] = [
  {
    id: 'property-boundaries',
    title: 'Fastighetsgränser',
    renderOrder: 10,
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
    id: 'climate-risk',
    title: 'Klimatriskzoner',
    renderOrder: 30,
    restricted: false,
  },
];

describe('layer decision support policy', () => {
  it('blocks restricted layers when the user lacks the required role', () => {
    const view = buildLayerDecisionView({
      layers: layerCatalog,
      selectedLayerIds: ['protected-imagery'],
      roles: ['case-worker', 'exporter'],
    });

    const imagery = view.decisions.find((decision) => decision.layer.id === 'protected-imagery');

    expect(imagery?.available).toBe(false);
    expect(imagery?.selected).toBe(false);
    expect(imagery?.disabledReason).toContain('restricted-geodata');
    expect(view.selectedLayerIds).not.toContain('protected-imagery');
  });

  it('keeps selected layers in map render order instead of click order', () => {
    const view = buildLayerDecisionView({
      layers: layerCatalog,
      selectedLayerIds: ['climate-risk', 'property-boundaries', 'protected-imagery'],
      roles: ['case-worker', 'restricted-geodata', 'exporter'],
    });

    expect(view.visibleLayerIds).toEqual([
      'property-boundaries',
      'protected-imagery',
      'climate-risk',
    ]);
  });

  it('does not toggle unavailable layers through the public selection interface', () => {
    const selectedIds = nextSelectedLayerIds(
      {
        layers: layerCatalog,
        selectedLayerIds: ['property-boundaries'],
        roles: ['case-worker', 'exporter'],
      },
      'protected-imagery',
    );

    expect(selectedIds).toEqual(['property-boundaries']);
  });
});
