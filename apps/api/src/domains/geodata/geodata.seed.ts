import { sql } from 'drizzle-orm';

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
  seedDefaultSearchTargetId,
  seedDefaultSelectedLayerIds,
  seedLayerCatalog,
  seedMapFeatures,
  seedSearchTargets,
} from './geodata.seed-data';

const WORKBENCH_SETTINGS_ID = 'default';

export async function seedGeodata(db: AppDatabase): Promise<void> {
  await db.transaction(async (transaction) => {
    await transaction
      .insert(decisionLayers)
      .values(
        seedLayerCatalog.map((layer) => ({
          id: layer.id,
          title: layer.title,
          renderOrder: layer.renderOrder,
          restricted: layer.restricted,
          requiredRole: layer.requiredRole,
        })),
      )
      .onConflictDoUpdate({
        target: decisionLayers.id,
        set: {
          title: sql`excluded.title`,
          renderOrder: sql`excluded.render_order`,
          restricted: sql`excluded.restricted`,
          requiredRole: sql`excluded.required_role`,
        },
      });

    await transaction
      .insert(searchTargets)
      .values(
        seedSearchTargets.map((target) => ({
          id: target.id,
          label: target.label,
          kind: target.kind,
          lon: target.lonLat.lon,
          lat: target.lonLat.lat,
          zoom: target.zoom,
          municipality: target.municipality,
          source: target.source,
        })),
      )
      .onConflictDoUpdate({
        target: searchTargets.id,
        set: {
          label: sql`excluded.label`,
          kind: sql`excluded.kind`,
          lon: sql`excluded.lon`,
          lat: sql`excluded.lat`,
          zoom: sql`excluded.zoom`,
          municipality: sql`excluded.municipality`,
          source: sql`excluded.source`,
        },
      });

    await transaction
      .insert(mapFeatures)
      .values(
        seedMapFeatures.map((feature) => ({
          id: feature.id,
          layerId: feature.layerId,
          geometryType: feature.geometryType,
        })),
      )
      .onConflictDoUpdate({
        target: mapFeatures.id,
        set: {
          layerId: sql`excluded.layer_id`,
          geometryType: sql`excluded.geometry_type`,
        },
      });

    await transaction.delete(mapFeatureCoordinates);
    await transaction.insert(mapFeatureCoordinates).values(
      seedMapFeatures.flatMap((feature) =>
        feature.coordinates.map((coordinate, position) => ({
          featureId: feature.id,
          position,
          lon: coordinate.lon,
          lat: coordinate.lat,
        })),
      ),
    );

    await transaction.delete(defaultSelectedLayers);
    await transaction.insert(defaultSelectedLayers).values(
      seedDefaultSelectedLayerIds.map((layerId, renderOrder) => ({
        layerId,
        renderOrder,
      })),
    );

    await transaction
      .insert(workbenchSettings)
      .values({
        id: WORKBENCH_SETTINGS_ID,
        defaultSearchTargetId: seedDefaultSearchTargetId,
      })
      .onConflictDoUpdate({
        target: workbenchSettings.id,
        set: {
          defaultSearchTargetId: sql`excluded.default_search_target_id`,
        },
      });
  });
}
