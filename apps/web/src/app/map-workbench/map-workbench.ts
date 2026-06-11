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
import { firstValueFrom } from 'rxjs';

import { AuthStore } from '../auth/auth.store';
import { MapWorkbenchApi } from './workbench-data/map-workbench-api';
import { buildLayerDecisionView, nextSelectedLayerIds } from './layers/layer-access-policy';
import { DecisionLayer, LayerDecisionInput, UserRole } from './layers/layer-decision.models';
import { formatTargetCoordinates } from './search/location-search-policy';
import { SearchTarget } from './search/location-search.models';
import { MapFeature } from './workbench-data/map-workbench.models';

type SearchMode = 'property' | 'address' | 'place' | 'planning-unit';
type MapLayerFeature = Feature<Geometry>;
type LonLatPair = [number, number];
type SearchStatus = 'idle' | 'searching' | 'found' | 'not-found' | 'error';

const FALLBACK_MAP_CENTER_LON_LAT: LonLatPair = [17.99449, 59.42447];

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
  private readonly mapWorkbenchApi = inject(MapWorkbenchApi);

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
  protected readonly selectedLayerIds = signal<readonly string[]>([]);
  protected readonly searchMode = signal<SearchMode>('property');
  protected readonly searchQuery = signal('');
  protected readonly searchStatus = signal<SearchStatus>('searching');
  protected readonly searchMessage = signal('Hämtar kartdata från backend...');
  protected readonly layerCatalog = signal<readonly DecisionLayer[]>([]);
  protected readonly selectedProperty = signal({
    name: 'Läser kartdata',
    type: 'Status',
    coordinates: 'Väntar på GraphQL-svar från backend',
  });
  protected readonly view = computed(() =>
    buildLayerDecisionView({
      layers: this.layerCatalog(),
      selectedLayerIds: this.selectedLayerIds(),
      roles: this.roles(),
    }),
  );

  private map?: OlMap;
  private layerSource?: VectorSource<MapLayerFeature>;
  private readonly mapFeatures = signal<readonly MapFeature[]>([]);
  private readonly defaultSearchTarget = signal<SearchTarget | undefined>(undefined);

  private readonly layerSync = effect(() => {
    this.syncVisibleMapLayers(this.view().visibleLayerIds);
  });

  constructor() {
    void this.loadWorkbench();
  }

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

    try {
      const [target] = await firstValueFrom(this.mapWorkbenchApi.searchTargets(query, 1));
      if (!target) {
        this.searchStatus.set('not-found');
        this.searchMessage.set('Ingen träff i Sverige');
        return;
      }

      this.applySearchTarget(target);
    } catch {
      this.searchStatus.set('error');
      this.searchMessage.set('Sökningen kunde inte nå backend');
    }
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
    const target = this.defaultSearchTarget();
    this.map?.getView().animate({
      center: fromLonLat(target ? lonLatPairFor(target) : FALLBACK_MAP_CENTER_LON_LAT),
      zoom: target?.zoom ?? 15,
      duration: 240,
    });
  }

  private async loadWorkbench(): Promise<void> {
    try {
      const workbench = await firstValueFrom(this.mapWorkbenchApi.loadWorkbench());

      this.layerCatalog.set(workbench.layers);
      this.mapFeatures.set(workbench.features);
      this.selectedLayerIds.set(workbench.defaultSelectedLayerIds);
      this.defaultSearchTarget.set(workbench.defaultSearchTarget);
      this.applySearchTarget(workbench.defaultSearchTarget, {
        animate: false,
        message: 'Vald fastighet',
      });
      this.syncVisibleMapLayers(this.view().visibleLayerIds);
    } catch {
      this.searchStatus.set('error');
      this.searchMessage.set('Kunde inte hämta kartdata från backend');
    }
  }

  private currentInput(): LayerDecisionInput {
    return {
      layers: this.layerCatalog(),
      selectedLayerIds: this.selectedLayerIds(),
      roles: this.roles(),
    };
  }

  private canRenderMap(target: HTMLDivElement | undefined): target is HTMLDivElement {
    return typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined' && !!target;
  }

  private initializeMap(target: HTMLDivElement): void {
    const vectorSource = new VectorSource<MapLayerFeature>();
    const defaultTarget = this.defaultSearchTarget();

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
        center: fromLonLat(
          defaultTarget ? lonLatPairFor(defaultTarget) : FALLBACK_MAP_CENTER_LON_LAT,
        ),
        zoom: 15,
        minZoom: 11,
        maxZoom: 19,
      }),
    });

    queueMicrotask(() => this.map?.updateSize());
  }

  private applySearchTarget(
    target: SearchTarget,
    options: { readonly animate?: boolean; readonly message?: string } = {},
  ): void {
    this.selectedProperty.set({
      name: target.label,
      type: this.displayTargetKind(target),
      coordinates: formatTargetCoordinates(target),
    });
    this.searchQuery.set(target.label);
    this.searchMode.set(this.searchModeForTarget(target));
    this.searchStatus.set('found');
    this.searchMessage.set(
      options.message ?? (target.source === 'local' ? 'Träff vald' : 'Extern träff vald'),
    );

    if (options.animate !== false) {
      this.map?.getView().animate({
        center: fromLonLat(lonLatPairFor(target)),
        zoom: target.zoom,
        duration: 320,
      });
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
    return this.mapFeatures()
      .filter((feature) => feature.layerId === layerId)
      .map((feature) => this.buildMapFeature(feature));
  }

  private buildMapFeature(sourceFeature: MapFeature): MapLayerFeature {
    const coordinates = sourceFeature.coordinates.map((coordinate) =>
      fromLonLat([coordinate.lon, coordinate.lat]),
    );
    const geometry =
      sourceFeature.geometryType === 'line-string'
        ? new LineString(coordinates)
        : new Polygon([coordinates]);
    const feature = new Feature({ geometry });

    feature.setStyle(this.styleForFeature(sourceFeature));

    return feature;
  }

  private styleForFeature(feature: MapFeature): Style | Style[] {
    if (feature.id === 'property-boundary') {
      return new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.38)',
        }),
        stroke: new Stroke({
          color: '#d93b3b',
          width: 4,
          lineDash: [14, 9],
        }),
      });
    }

    if (feature.id === 'climate-risk-heat') {
      return new Style({
        fill: new Fill({
          color: 'rgba(217, 59, 59, 0.22)',
        }),
        stroke: new Stroke({
          color: '#d93b3b',
          lineDash: [10, 6],
          width: 3,
        }),
        zIndex: 20,
      });
    }

    if (feature.id === 'climate-risk-flood') {
      return new Style({
        fill: new Fill({
          color: 'rgba(47, 109, 147, 0.28)',
        }),
        stroke: new Stroke({
          color: '#2f6d93',
          width: 3,
        }),
        zIndex: 21,
      });
    }

    if (feature.id === 'protected-imagery-extent') {
      return new Style({
        fill: new Fill({
          color: 'rgba(41, 49, 45, 0.24)',
        }),
        stroke: new Stroke({
          color: '#29312d',
          lineDash: [6, 7],
          width: 3,
        }),
        zIndex: 10,
      });
    }

    if (feature.id === 'utility-corridor') {
      return [
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
      ];
    }

    return new Style({
      stroke: new Stroke({
        color: '#44504b',
        width: 3,
      }),
    });
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

function lonLatPairFor(target: SearchTarget): LonLatPair {
  return [target.lonLat.lon, target.lonLat.lat];
}
