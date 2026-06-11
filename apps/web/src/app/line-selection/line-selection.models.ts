import { LocaleCode, UserRole } from '../layer-decision-support/layer-decision-support.models';

export type PlanningLineCategory = 'Atkomst' | 'Ledning' | 'Strand' | 'Risk';
export type PlanningLineRisk = 'low' | 'medium' | 'high';

export interface PlanningLine {
  id: string;
  title: string;
  summary: string;
  category: PlanningLineCategory;
  risk: PlanningLineRisk;
  lengthMeters: number;
  reviewPriority: number;
  restricted: boolean;
  requiredRole?: UserRole;
  coordinates: readonly [number, number][];
}

export interface LineSelectionInput {
  lines: readonly PlanningLine[];
  selectedLineIds: readonly string[];
  roles: readonly UserRole[];
  locale: LocaleCode;
}

export interface LineDecision {
  line: PlanningLine;
  available: boolean;
  selected: boolean;
  disabledReason?: string;
  displayLength: string;
}

export interface LineSelectionView {
  decisions: readonly LineDecision[];
  selectedLineIds: readonly string[];
  selectedCount: number;
  blockedCount: number;
  totalLengthMeters: number;
  totalLengthLabel: string;
  selectedCategories: readonly PlanningLineCategory[];
}
