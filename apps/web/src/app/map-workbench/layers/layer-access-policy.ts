import {
  DecisionLayer,
  UserRole,
  LayerDecision,
  LayerDecisionInput,
  LayerDecisionView,
} from './layer-decision.models';

export function buildLayerDecisionView(input: LayerDecisionInput): LayerDecisionView {
  const roleSet = new Set<UserRole>(input.roles);
  const sortedLayers = [...input.layers].sort(
    (left, right) => left.renderOrder - right.renderOrder,
  );
  const selectedIds = new Set(input.selectedLayerIds);

  const decisions = sortedLayers.map((layer) => {
    const available = isLayerAvailable(layer, roleSet);
    const selected = available && selectedIds.has(layer.id);

    return {
      layer,
      available,
      selected,
      disabledReason: available
        ? undefined
        : `Kräver roll: ${layer.requiredRole ?? 'restricted-geodata'}.`,
    } satisfies LayerDecision;
  });

  const selectedDecisions = decisions.filter((decision) => decision.selected);

  return {
    decisions,
    selectedLayerIds: selectedDecisions.map((decision) => decision.layer.id),
    visibleLayerIds: selectedDecisions.map((decision) => decision.layer.id),
    blockedCount: decisions.filter((decision) => !decision.available).length,
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
