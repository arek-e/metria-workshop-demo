import {
  LineDecision,
  LineSelectionInput,
  LineSelectionView,
  PlanningLine,
  PlanningLineCategory,
} from './line-selection.models';
import { UserRole } from '../layer-decision-support/layer-decision-support.models';

export function buildLineSelectionView(input: LineSelectionInput): LineSelectionView {
  const roleSet = new Set<UserRole>(input.roles);
  const selectedIds = new Set(input.selectedLineIds);
  const sortedLines = [...input.lines].sort(
    (left, right) => left.reviewPriority - right.reviewPriority,
  );

  const decisions = sortedLines.map((line) => {
    const available = isLineAvailable(line, roleSet);

    return {
      line,
      available,
      selected: available && selectedIds.has(line.id),
      disabledReason: available
        ? undefined
        : `Kräver roll: ${line.requiredRole ?? 'restricted-geodata'}.`,
      displayLength: formatLength(line.lengthMeters, input.locale),
    } satisfies LineDecision;
  });

  const selectedDecisions = decisions.filter((decision) => decision.selected);

  return {
    decisions,
    selectedLineIds: selectedDecisions.map((decision) => decision.line.id),
    selectedCount: selectedDecisions.length,
    blockedCount: decisions.filter((decision) => !decision.available).length,
    totalLengthMeters: selectedDecisions.reduce(
      (total, decision) => total + decision.line.lengthMeters,
      0,
    ),
    totalLengthLabel: formatLength(
      selectedDecisions.reduce((total, decision) => total + decision.line.lengthMeters, 0),
      input.locale,
    ),
    selectedCategories: uniqueCategories(
      selectedDecisions.map((decision) => decision.line.category),
    ),
  };
}

export function nextSelectedLineIds(
  input: LineSelectionInput,
  toggledLineId: string,
): readonly string[] {
  const view = buildLineSelectionView(input);
  const decision = view.decisions.find((candidate) => candidate.line.id === toggledLineId);

  if (!decision?.available) {
    return view.selectedLineIds;
  }

  const selected = new Set(view.selectedLineIds);
  if (selected.has(toggledLineId)) {
    selected.delete(toggledLineId);
  } else {
    selected.add(toggledLineId);
  }

  return buildLineSelectionView({
    ...input,
    selectedLineIds: [...selected],
  }).selectedLineIds;
}

function isLineAvailable(line: PlanningLine, roles: ReadonlySet<UserRole>): boolean {
  if (!line.restricted) {
    return true;
  }

  return line.requiredRole ? roles.has(line.requiredRole) : roles.has('restricted-geodata');
}

function formatLength(lengthMeters: number, locale: string): string {
  return `${new Intl.NumberFormat(locale).format(lengthMeters)} m`;
}

function uniqueCategories(
  categories: readonly PlanningLineCategory[],
): readonly PlanningLineCategory[] {
  return [...new Set(categories)];
}
