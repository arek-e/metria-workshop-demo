import { MapWorkbenchData, SearchTarget } from './geodata.models';
import { GeodataRepository } from './geodata.repository';
import {
  seedDefaultSearchTargetId,
  seedDefaultSelectedLayerIds,
  seedLayerCatalog,
  seedMapFeatures,
  seedSearchTargets,
} from './geodata.seed-data';

export class InMemoryGeodataRepository implements GeodataRepository {
  async getMapWorkbench(): Promise<MapWorkbenchData> {
    const defaultSearchTarget = seedSearchTargets.find(
      (target) => target.id === seedDefaultSearchTargetId,
    );

    if (!defaultSearchTarget) {
      throw new Error(`Missing default search target: ${seedDefaultSearchTargetId}`);
    }

    return {
      layers: seedLayerCatalog,
      defaultSelectedLayerIds: seedDefaultSelectedLayerIds,
      defaultSearchTarget,
      features: seedMapFeatures,
    };
  }

  async listSearchTargets(): Promise<readonly SearchTarget[]> {
    return seedSearchTargets;
  }
}
