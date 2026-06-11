import { LAYER_CATALOG } from './layer-catalog.fixture';
import { buildLayerDecisionView, nextSelectedLayerIds } from './layer-access-policy';

describe('layer decision support policy', () => {
  it('blocks restricted layers when the user lacks the required role', () => {
    const view = buildLayerDecisionView({
      layers: LAYER_CATALOG,
      selectedLayerIds: ['protected-imagery'],
      roles: ['case-worker', 'exporter'],
      locale: 'en-GB',
      currentProjection: 'EPSG:3006',
    });

    const imagery = view.decisions.find((decision) => decision.layer.id === 'protected-imagery');

    expect(imagery?.available).toBe(false);
    expect(imagery?.selected).toBe(false);
    expect(imagery?.disabledReason).toContain('restricted-geodata');
    expect(view.selectedLayerIds).not.toContain('protected-imagery');
  });

  it('keeps selected layers in map render order instead of click order', () => {
    const view = buildLayerDecisionView({
      layers: LAYER_CATALOG,
      selectedLayerIds: ['climate-risk', 'property-boundaries', 'protected-imagery'],
      roles: ['case-worker', 'restricted-geodata', 'exporter'],
      locale: 'en-GB',
      currentProjection: 'EPSG:3006',
    });

    expect(view.visibleLayerIds).toEqual([
      'property-boundaries',
      'protected-imagery',
      'climate-risk',
    ]);
  });

  it('reports projection warnings only for selected layers that differ from the current map projection', () => {
    const view = buildLayerDecisionView({
      layers: LAYER_CATALOG,
      selectedLayerIds: ['property-boundaries', 'protected-imagery'],
      roles: ['case-worker', 'restricted-geodata', 'exporter'],
      locale: 'en-GB',
      currentProjection: 'EPSG:3006',
    });

    expect(view.projectionWarningCount).toBe(1);
    expect(
      view.decisions.find((decision) => decision.layer.id === 'protected-imagery')
        ?.projectionWarning,
    ).toContain('EPSG:3857');
  });

  it('only marks export as ready when selected layers share at least one export format', () => {
    const compatible = buildLayerDecisionView({
      layers: LAYER_CATALOG,
      selectedLayerIds: ['property-boundaries', 'climate-risk'],
      roles: ['case-worker', 'exporter'],
      locale: 'en-GB',
      currentProjection: 'EPSG:3006',
    });

    const incompatible = buildLayerDecisionView({
      layers: LAYER_CATALOG,
      selectedLayerIds: ['protected-imagery', 'utility-corridors'],
      roles: ['case-worker', 'restricted-geodata', 'exporter'],
      locale: 'en-GB',
      currentProjection: 'EPSG:3006',
    });

    expect(compatible.exportReady).toBe(true);
    expect(compatible.exportFormats).toEqual(['pdf', 'xlsx']);
    expect(incompatible.exportReady).toBe(false);
    expect(incompatible.exportFormats).toEqual([]);
  });

  it('does not toggle unavailable layers through the public selection interface', () => {
    const selectedIds = nextSelectedLayerIds(
      {
        layers: LAYER_CATALOG,
        selectedLayerIds: ['property-boundaries'],
        roles: ['case-worker', 'exporter'],
        locale: 'en-GB',
        currentProjection: 'EPSG:3006',
      },
      'protected-imagery',
    );

    expect(selectedIds).toEqual(['property-boundaries']);
  });
});
