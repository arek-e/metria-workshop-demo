import { buildLineSelectionView, nextSelectedLineIds } from './line-selection-policy';
import { PLANNING_LINES } from './planning-lines.fixture';

describe('buildLineSelectionView', () => {
  it('keeps selected planning lines in review priority order instead of click order', () => {
    const view = buildLineSelectionView({
      lines: PLANNING_LINES,
      selectedLineIds: ['shoreline-setback', 'service-access'],
      roles: ['case-worker'],
      locale: 'en-GB',
    });

    expect(view.selectedLineIds).toEqual(['service-access', 'shoreline-setback']);
  });

  it('does not select restricted planning lines without elevated geodata access', () => {
    const selectedLineIds = nextSelectedLineIds(
      {
        lines: PLANNING_LINES,
        selectedLineIds: ['service-access'],
        roles: ['case-worker'],
        locale: 'en-GB',
      },
      'utility-easement',
    );

    expect(selectedLineIds).toEqual(['service-access']);
  });

  it('summarizes selected planning line length and categories for review', () => {
    const view = buildLineSelectionView({
      lines: PLANNING_LINES,
      selectedLineIds: ['service-access', 'flood-review'],
      roles: ['case-worker'],
      locale: 'en-GB',
    });

    expect(view.selectedCount).toBe(2);
    expect(view.totalLengthMeters).toBe(1010);
    expect(view.totalLengthLabel).toBe('1,010 m');
    expect(view.selectedCategories).toEqual(['Atkomst', 'Risk']);
  });
});
