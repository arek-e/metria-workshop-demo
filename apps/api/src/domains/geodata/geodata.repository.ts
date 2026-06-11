import { MapWorkbenchData, SearchTarget } from './geodata.models';

export interface GeodataRepository {
  getMapWorkbench(): Promise<MapWorkbenchData>;
  listSearchTargets(): Promise<readonly SearchTarget[]>;
}
