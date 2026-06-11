import {
  DecisionLayer,
  UserRole,
  ExportFormat,
  LayerDecision,
  LayerDecisionInput,
  LayerDecisionView,
} from './layer-decision-support.models';

const EXPORT_FORMATS: readonly ExportFormat[] = ['pdf', 'xlsx', 'docx'];

export function buildLayerDecisionView(input: LayerDecisionInput): LayerDecisionView {
  const roleSet = new Set<UserRole>(input.roles);
  const sortedLayers = [...input.layers].sort(
    (left, right) => left.renderOrder - right.renderOrder,
  );
  const selectedIds = new Set(input.selectedLayerIds);

  const decisions = sortedLayers.map((layer) => {
    const available = isLayerAvailable(layer, roleSet);
    const selected = available && selectedIds.has(layer.id);
    const projectionWarning =
      layer.projection === input.currentProjection
        ? undefined
        : `Lagret använder ${layer.projection}; kartan visar ${input.currentProjection}.`;

    return {
      layer,
      available,
      selected,
      canExport: selected && layer.exportFormats.length > 0,
      disabledReason: available
        ? undefined
        : `Kräver roll: ${layer.requiredRole ?? 'restricted-geodata'}.`,
      projectionWarning,
      displayQuality: formatQuality(layer, input.locale),
    } satisfies LayerDecision;
  });

  const selectedDecisions = decisions.filter((decision) => decision.selected);
  const exportFormats = EXPORT_FORMATS.filter((format) =>
    selectedDecisions.every((decision) => decision.layer.exportFormats.includes(format)),
  );

  return {
    decisions,
    selectedLayerIds: selectedDecisions.map((decision) => decision.layer.id),
    visibleLayerIds: selectedDecisions.map((decision) => decision.layer.id),
    blockedCount: decisions.filter((decision) => !decision.available).length,
    projectionWarningCount: selectedDecisions.filter((decision) => decision.projectionWarning)
      .length,
    exportReady: selectedDecisions.length > 0 && exportFormats.length > 0,
    exportFormats,
    highestQualityScore: selectedDecisions.reduce(
      (highest, decision) => Math.max(highest, decision.layer.quality.score),
      0,
    ),
  };
}

export function nextSelectedLayerIds(
  input: LayerDecisionInput,
  toggledLayerId: string,
): readonly string[] {
  const view = buildLayerDecisionView(input);
  const decision = view.decisions.find((candidate) => candidate.layer.id === toggledLayerId);

  if (!decision?.available) {
    return view.selectedLayerIds;
  }

  const selected = new Set(view.selectedLayerIds);
  if (selected.has(toggledLayerId)) {
    selected.delete(toggledLayerId);
  } else {
    selected.add(toggledLayerId);
  }

  const nextView = buildLayerDecisionView({
    ...input,
    selectedLayerIds: [...selected],
  });

  return nextView.selectedLayerIds;
}

function isLayerAvailable(layer: DecisionLayer, roles: ReadonlySet<UserRole>): boolean {
  if (!layer.restricted) {
    return true;
  }

  return layer.requiredRole ? roles.has(layer.requiredRole) : roles.has('restricted-geodata');
}

function formatQuality(layer: DecisionLayer, locale: string): string {
  const updatedAt = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(layer.quality.updatedAt));

  return `${layer.quality.score}/100 - ${layer.quality.source} - ${updatedAt}`;
}
