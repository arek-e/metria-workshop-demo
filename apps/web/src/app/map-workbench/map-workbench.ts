import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import Feature from 'ol/Feature.js';
import OlMap from 'ol/Map.js';
import View from 'ol/View.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import Geometry from 'ol/geom/Geometry.js';
import LineString from 'ol/geom/LineString.js';
import Polygon from 'ol/geom/Polygon.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import { fromLonLat } from 'ol/proj.js';
import OSM from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector.js';
import { Fill, Stroke, Style } from 'ol/style.js';

import { AuthStore } from '../auth/auth.store';
import {
  buildLayerDecisionView,
  nextSelectedLayerIds,
} from '../layer-decision-support/layer-access-policy';
import { LAYER_CATALOG } from '../layer-decision-support/layer-catalog.fixture';
import {
  UserRole,
  LayerDecisionInput,
} from '../layer-decision-support/layer-decision-support.models';
import {
  findLocalSearchTarget,
  formatTargetCoordinates,
} from '../location-search/location-search-policy';
import { SearchTarget } from '../location-search/location-search.models';

const MAP_CENTER_LON_LAT: [number, number] = [17.99449, 59.42447];
const PROPERTY_POLYGON_LON_LAT: readonly [number, number][] = [
  [17.9936, 59.4249],
  [17.9947, 59.4251],
  [17.9954, 59.4245],
  [17.9948, 59.4239],
  [17.9935, 59.424],
  [17.9936, 59.4249],
];
const CLIMATE_RISK_ZONE_LON_LAT: readonly [number, number][] = [
  [17.9899, 59.4259],
  [17.9962, 59.4263],
  [17.9991, 59.4237],
  [17.9951, 59.4224],
  [17.9902, 59.4233],
  [17.9899, 59.4259],
];
const FLOOD_SECTION_LON_LAT: readonly [number, number][] = [
  [17.9887, 59.4232],
  [17.9935, 59.4228],
  [18, 59.4223],
  [17.9996, 59.4216],
  [17.9931, 59.4221],
  [17.9885, 59.4225],
  [17.9887, 59.4232],
];
const PROTECTED_IMAGERY_EXTENT_LON_LAT: readonly [number, number][] = [
  [17.9876, 59.4267],
  [18.0031, 59.4259],
  [18.0018, 59.4201],
  [17.9863, 59.4209],
  [17.9876, 59.4267],
];
const UTILITY_CORRIDOR_LON_LAT: readonly [number, number][] = [
  [17.9879, 59.4268],
  [17.9921, 59.4252],
  [17.9961, 59.4237],
  [18.0017, 59.4214],
];

type SearchMode = 'property' | 'address' | 'place' | 'planning-unit';
type MapLayerFeature = Feature<Geometry>;

@Component({
  selector: 'app-map-workbench',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './map-workbench.html',
  styleUrl: './map-workbench.scss',
})
export class MapWorkbench implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') private readonly mapContainer?: ElementRef<HTMLDivElement>;

  private readonly authStore = inject(AuthStore);

  protected readonly authState = toSignal(this.authStore.state$, {
    initialValue: this.authStore.snapshot,
  });
  protected readonly roles = computed<readonly UserRole[]>(
    () => this.authState().user?.roles ?? [],
  );
  protected readonly roleSummary = computed(() => {
    const roles = this.roles();

    return roles.length ? roles.join(', ') : 'Inga Keycloak-roller';
  });
  protected readonly userInitials = computed(() =>
    initialsFor(this.authState().user?.displayName ?? this.authState().user?.username ?? ''),
  );
  protected readonly mapAriaLabel = computed(() => {
    const visibleLayerTitles = this.view()
      .decisions.filter((decision) => decision.selected)
      .map((decision) => decision.layer.title);

    return visibleLayerTitles.length
      ? `OpenLayers-karta med synliga lager: ${visibleLayerTitles.join(', ')}`
      : 'OpenLayers-karta utan aktiva geodatalager';
  });
  protected readonly selectedLayerIds = signal<readonly string[]>([
    'property-boundaries',
    'climate-risk',
  ]);
  protected readonly searchMode = signal<SearchMode>('property');
  protected readonly searchQuery = signal('SOLLENTUNA SJÖBERG 5:5');
  protected readonly searchStatus = signal<'idle' | 'searching' | 'found' | 'not-found' | 'error'>(
    'idle',
  );
  protected readonly searchMessage = signal('Vald fastighet');
  protected readonly layerCatalog = LAYER_CATALOG;
  protected readonly selectedProperty = signal({
    name: 'SOLLENTUNA SJÖBERG 5:5',
    type: 'Fastighet',
    coordinates: 'Sjöberg, Sollentuna · Riktnummer 08 · N 59.4245, E 17.9945 WGS84',
  });
  protected readonly view = computed(() =>
    buildLayerDecisionView({
      layers: this.layerCatalog,
      selectedLayerIds: this.selectedLayerIds(),
      roles: this.roles(),
    }),
  );

  private map?: OlMap;
  private layerSource?: VectorSource<MapLayerFeature>;

  private readonly layerSync = effect(() => {
    this.syncVisibleMapLayers(this.view().visibleLayerIds);
  });

  ngAfterViewInit(): void {
    const target = this.mapContainer?.nativeElement;
    if (!this.canRenderMap(target)) {
      return;
    }

    this.initializeMap(target);
  }

  ngOnDestroy(): void {
    this.map?.dispose();
  }

  protected toggleLayer(layerId: string): void {
    this.selectedLayerIds.set(nextSelectedLayerIds(this.currentInput(), layerId));
  }

  protected setSearchMode(mode: SearchMode): void {
    this.searchMode.set(mode);
  }

  protected setSearchQuery(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.searchQuery.set(input.value);
    }
  }

  protected async runSearch(): Promise<void> {
    const query = this.searchQuery().trim();
    if (!query) {
      return;
    }

    this.searchStatus.set('searching');
    this.searchMessage.set('Söker...');

    const target = findLocalSearchTarget(query) ?? (await this.findRemoteSearchTarget(query));
    if (!target) {
      this.searchStatus.set('not-found');
      this.searchMessage.set('Ingen träff i Sverige');
      return;
    }

    this.applySearchTarget(target);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.searchStatus.set('idle');
    this.searchMessage.set('Skriv ort, adress eller fastighetsbeteckning');
  }

  protected login(): void {
    void this.authStore.login();
  }

  protected logout(): void {
    void this.authStore.logout();
  }

  protected zoomBy(delta: number): void {
    const view = this.map?.getView();
    const zoom = view?.getZoom();
    if (!view || zoom === undefined) {
      return;
    }

    view.animate({
      zoom: zoom + delta,
      duration: 180,
    });
  }

  protected goToProperty(): void {
    this.map?.getView().animate({
      center: fromLonLat(MAP_CENTER_LON_LAT),
      zoom: 15,
      duration: 240,
    });
  }

  private currentInput(): LayerDecisionInput {
    return {
      layers: this.layerCatalog,
      selectedLayerIds: this.selectedLayerIds(),
      roles: this.roles(),
    };
  }

  private canRenderMap(target: HTMLDivElement | undefined): target is HTMLDivElement {
    return typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined' && !!target;
  }

  private initializeMap(target: HTMLDivElement): void {
    const vectorSource = new VectorSource<MapLayerFeature>();
    this.layerSource = vectorSource;
    this.syncVisibleMapLayers(this.view().visibleLayerIds);

    this.map = new OlMap({
      target,
      controls: defaultControls({
        zoom: false,
        rotate: false,
        attributionOptions: {
          collapsible: true,
        },
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new VectorLayer({
          source: vectorSource,
        }),
      ],
      view: new View({
        center: fromLonLat(MAP_CENTER_LON_LAT),
        zoom: 15,
        minZoom: 11,
        maxZoom: 19,
      }),
    });

    queueMicrotask(() => this.map?.updateSize());
  }

  private applySearchTarget(target: SearchTarget): void {
    this.selectedProperty.set({
      name: target.label,
      type: this.displayTargetKind(target),
      coordinates: formatTargetCoordinates(target),
    });
    this.searchQuery.set(target.label);
    this.searchMode.set(this.searchModeForTarget(target));
    this.searchStatus.set('found');
    this.searchMessage.set(target.source === 'local' ? 'Träff vald' : 'Extern träff vald');
    this.map?.getView().animate({
      center: fromLonLat([target.lonLat[0], target.lonLat[1]]),
      zoom: target.zoom,
      duration: 320,
    });
  }

  private async findRemoteSearchTarget(query: string): Promise<SearchTarget | undefined> {
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'jsonv2',
        countrycodes: 'se',
        limit: '1',
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
      if (!response.ok) {
        return undefined;
      }

      const results = (await response.json()) as readonly {
        display_name?: string;
        lat?: string;
        lon?: string;
        type?: string;
      }[];
      const result = results[0];
      const lat = result?.lat ? Number(result.lat) : Number.NaN;
      const lon = result?.lon ? Number(result.lon) : Number.NaN;

      if (!result || !Number.isFinite(lat) || !Number.isFinite(lon)) {
        return undefined;
      }

      return {
        id: `nominatim-${query}`,
        label: result.display_name?.split(',')[0] ?? query,
        kind: result.type === 'house' ? 'address' : 'place',
        lonLat: [lon, lat],
        zoom: result.type === 'house' ? 17 : 12,
        source: 'nominatim',
      };
    } catch {
      this.searchStatus.set('error');
      this.searchMessage.set('Sökningen kunde inte nå extern geokodning');
      return undefined;
    }
  }

  private displayTargetKind(target: SearchTarget): string {
    if (target.kind === 'property') {
      return 'Fastighet';
    }

    if (target.kind === 'address') {
      return 'Adress';
    }

    return 'Ort';
  }

  private searchModeForTarget(target: SearchTarget): SearchMode {
    if (target.kind === 'property') {
      return 'property';
    }

    if (target.kind === 'address') {
      return 'address';
    }

    return 'place';
  }

  private buildPropertyFeature(): Feature<Polygon> {
    const feature = new Feature({
      geometry: new Polygon([PROPERTY_POLYGON_LON_LAT.map((coordinate) => fromLonLat(coordinate))]),
    });

    feature.setStyle(
      new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.38)',
        }),
        stroke: new Stroke({
          color: '#d93b3b',
          width: 4,
          lineDash: [14, 9],
        }),
      }),
    );

    return feature;
  }

  private syncVisibleMapLayers(visibleLayerIds: readonly string[]): void {
    if (!this.layerSource) {
      return;
    }

    this.layerSource.clear(true);
    this.layerSource.addFeatures(
      visibleLayerIds.flatMap((layerId) => this.buildMapLayerFeatures(layerId)),
    );
  }

  private buildMapLayerFeatures(layerId: string): readonly MapLayerFeature[] {
    if (layerId === 'property-boundaries') {
      return [this.buildPropertyFeature()];
    }

    if (layerId === 'climate-risk') {
      return this.buildClimateRiskFeatures();
    }

    if (layerId === 'protected-imagery') {
      return [this.buildProtectedImageryFeature()];
    }

    if (layerId === 'utility-corridors') {
      return [this.buildUtilityCorridorFeature()];
    }

    return [];
  }

  private buildClimateRiskFeatures(): readonly MapLayerFeature[] {
    const heatFeature = new Feature({
      geometry: new Polygon([
        CLIMATE_RISK_ZONE_LON_LAT.map((coordinate) => fromLonLat(coordinate)),
      ]),
    });
    heatFeature.setStyle(
      new Style({
        fill: new Fill({
          color: 'rgba(217, 59, 59, 0.22)',
        }),
        stroke: new Stroke({
          color: '#d93b3b',
          lineDash: [10, 6],
          width: 3,
        }),
        zIndex: 20,
      }),
    );

    const floodFeature = new Feature({
      geometry: new Polygon([FLOOD_SECTION_LON_LAT.map((coordinate) => fromLonLat(coordinate))]),
    });
    floodFeature.setStyle(
      new Style({
        fill: new Fill({
          color: 'rgba(47, 109, 147, 0.28)',
        }),
        stroke: new Stroke({
          color: '#2f6d93',
          width: 3,
        }),
        zIndex: 21,
      }),
    );

    return [heatFeature, floodFeature];
  }

  private buildProtectedImageryFeature(): MapLayerFeature {
    const feature = new Feature({
      geometry: new Polygon([
        PROTECTED_IMAGERY_EXTENT_LON_LAT.map((coordinate) => fromLonLat(coordinate)),
      ]),
    });

    feature.setStyle(
      new Style({
        fill: new Fill({
          color: 'rgba(41, 49, 45, 0.24)',
        }),
        stroke: new Stroke({
          color: '#29312d',
          lineDash: [6, 7],
          width: 3,
        }),
        zIndex: 10,
      }),
    );

    return feature;
  }

  private buildUtilityCorridorFeature(): MapLayerFeature {
    const feature = new Feature({
      geometry: new LineString(
        UTILITY_CORRIDOR_LON_LAT.map((coordinate) => fromLonLat(coordinate)),
      ),
    });

    feature.setStyle([
      new Style({
        stroke: new Stroke({
          color: 'rgba(255, 255, 255, 0.88)',
          width: 9,
        }),
        zIndex: 30,
      }),
      new Style({
        stroke: new Stroke({
          color: '#8c491a',
          lineDash: [14, 8],
          width: 5,
        }),
        zIndex: 31,
      }),
    ]);

    return feature;
  }
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return '?';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
