export type UserRole = 'case-worker' | 'restricted-geodata' | 'exporter';

export interface DecisionLayer {
  id: string;
  title: string;
  renderOrder: number;
  restricted: boolean;
  requiredRole?: UserRole;
}

export interface LayerDecisionInput {
  layers: readonly DecisionLayer[];
  selectedLayerIds: readonly string[];
  roles: readonly UserRole[];
}

export interface LayerDecision {
  layer: DecisionLayer;
  available: boolean;
  selected: boolean;
  disabledReason?: string;
}

export interface LayerDecisionView {
  decisions: readonly LayerDecision[];
  selectedLayerIds: readonly string[];
  visibleLayerIds: readonly string[];
  blockedCount: number;
}
