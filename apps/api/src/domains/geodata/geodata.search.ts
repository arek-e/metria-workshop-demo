import { SearchTarget } from './geodata.models';
import { InMemoryGeodataRepository } from './geodata.memory-repository';
import { GeodataRepository } from './geodata.repository';

export class GeodataSearchService {
  constructor(private readonly repository: GeodataRepository = new InMemoryGeodataRepository()) {}

  async searchTargets(query: string, limit = 5): Promise<readonly SearchTarget[]> {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) {
      return [];
    }

    const targets = await this.repository.listSearchTargets();

    return targets
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
