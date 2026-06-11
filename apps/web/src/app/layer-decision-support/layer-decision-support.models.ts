export type UserRole = 'case-worker' | 'restricted-geodata' | 'exporter';
export type LocaleCode = 'sv-SE' | 'en-GB';
export type ExportFormat = 'pdf' | 'xlsx' | 'docx';

export interface QualitySignal {
  score: number;
  updatedAt: string;
  source: string;
  srid: string;
}

export interface DecisionLayer {
  id: string;
  title: string;
  summary: string;
  category: 'Fastighet' | 'Klimat' | 'Flygbild' | 'Infrastruktur';
  renderOrder: number;
  projection: 'EPSG:3006' | 'EPSG:3857';
  restricted: boolean;
  requiredRole?: UserRole;
  quality: QualitySignal;
  exportFormats: ExportFormat[];
}

export interface LayerDecisionInput {
  layers: readonly DecisionLayer[];
  selectedLayerIds: readonly string[];
  roles: readonly UserRole[];
  locale: LocaleCode;
  currentProjection: 'EPSG:3006' | 'EPSG:3857';
}

export interface LayerDecision {
  layer: DecisionLayer;
  available: boolean;
  selected: boolean;
  canExport: boolean;
  disabledReason?: string;
  projectionWarning?: string;
  displayQuality: string;
}

export interface LayerDecisionView {
  decisions: readonly LayerDecision[];
  selectedLayerIds: readonly string[];
  visibleLayerIds: readonly string[];
  blockedCount: number;
  projectionWarningCount: number;
  exportReady: boolean;
  exportFormats: readonly ExportFormat[];
  highestQualityScore: number;
}
