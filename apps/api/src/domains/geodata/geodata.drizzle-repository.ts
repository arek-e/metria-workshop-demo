import { asc, eq } from 'drizzle-orm';

import { AppDatabase } from '../../db/client';
import {
  decisionLayers,
  defaultSelectedLayers,
  mapFeatureCoordinates,
  mapFeatures,
  searchTargets,
  workbenchSettings,
} from '../../db/schema';
import {
  DecisionLayer,
  MapFeature,
  MapGeometryType,
  MapWorkbenchData,
  SearchTarget,
  SearchTargetKind,
  SearchTargetSource,
} from './geodata.models';
import { GeodataRepository } from './geodata.repository';

const WORKBENCH_SETTINGS_ID = 'default';

export class DrizzleGeodataRepository implements GeodataRepository {
  constructor(private readonly db: AppDatabase) {}

  async getMapWorkbench(): Promise<MapWorkbenchData> {
    const [layers, selectedLayers, target, features] = await Promise.all([
      this.listDecisionLayers(),
      this.listDefaultSelectedLayerIds(),
      this.getDefaultSearchTarget(),
      this.listMapFeatures(),
    ]);

    return {
      layers,
      defaultSelectedLayerIds: selectedLayers,
      defaultSearchTarget: target,
      features,
    };
  }

  async listSearchTargets(): Promise<readonly SearchTarget[]> {
    const rows = await this.db.select().from(searchTargets).orderBy(asc(searchTargets.label));

    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      kind: row.kind as SearchTargetKind,
      lonLat: { lon: row.lon, lat: row.lat },
      zoom: row.zoom,
      municipality: row.municipality ?? undefined,
      source: row.source as SearchTargetSource,
    }));
  }

  private async listDecisionLayers(): Promise<readonly DecisionLayer[]> {
    const rows = await this.db
      .select()
      .from(decisionLayers)
      .orderBy(asc(decisionLayers.renderOrder));

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      renderOrder: row.renderOrder,
      restricted: row.restricted,
      requiredRole: row.requiredRole ?? undefined,
    }));
  }

  private async listDefaultSelectedLayerIds(): Promise<readonly string[]> {
    const rows = await this.db
      .select({ layerId: defaultSelectedLayers.layerId })
      .from(defaultSelectedLayers)
      .orderBy(asc(defaultSelectedLayers.renderOrder));

    return rows.map((row) => row.layerId);
  }

  private async getDefaultSearchTarget(): Promise<SearchTarget> {
    const [settings] = await this.db
      .select({ targetId: workbenchSettings.defaultSearchTargetId })
      .from(workbenchSettings)
      .where(eq(workbenchSettings.id, WORKBENCH_SETTINGS_ID))
      .limit(1);

    if (!settings) {
      throw new Error('Missing workbench settings row.');
    }

    const [target] = await this.db
      .select()
      .from(searchTargets)
      .where(eq(searchTargets.id, settings.targetId))
      .limit(1);

    if (!target) {
      throw new Error(`Missing default search target: ${settings.targetId}`);
    }

    return {
      id: target.id,
      label: target.label,
      kind: target.kind as SearchTargetKind,
      lonLat: { lon: target.lon, lat: target.lat },
      zoom: target.zoom,
      municipality: target.municipality ?? undefined,
      source: target.source as SearchTargetSource,
    };
  }

  private async listMapFeatures(): Promise<readonly MapFeature[]> {
    const [featureRows, coordinateRows] = await Promise.all([
      this.db.select().from(mapFeatures).orderBy(asc(mapFeatures.id)),
      this.db
        .select()
        .from(mapFeatureCoordinates)
        .orderBy(asc(mapFeatureCoordinates.featureId), asc(mapFeatureCoordinates.position)),
    ]);
    const coordinatesByFeatureId = new Map<string, { lon: number; lat: number }[]>();

    for (const row of coordinateRows) {
      const coordinates = coordinatesByFeatureId.get(row.featureId) ?? [];
      coordinates.push({ lon: row.lon, lat: row.lat });
      coordinatesByFeatureId.set(row.featureId, coordinates);
    }

    return featureRows.map((row) => ({
      id: row.id,
      layerId: row.layerId,
      geometryType: row.geometryType as MapGeometryType,
      coordinates: coordinatesByFeatureId.get(row.id) ?? [],
    }));
  }
}
