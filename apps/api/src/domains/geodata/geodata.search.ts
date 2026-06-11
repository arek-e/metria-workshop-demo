import { SearchTarget } from './geodata.models';
import { GeodataRepository } from './geodata.repository';

export class GeodataSearchService {
  constructor(private readonly repository = new GeodataRepository()) {}

  searchTargets(query: string, limit = 5): readonly SearchTarget[] {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) {
      return [];
    }

    return this.repository
      .listSearchTargets()
      .filter((target) =>
        normalizeSearchText(`${target.label} ${target.municipality ?? ''}`).includes(
          normalizedQuery,
        ),
      )
      .slice(0, Math.max(1, limit));
  }
}

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('sv-SE')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');
}
