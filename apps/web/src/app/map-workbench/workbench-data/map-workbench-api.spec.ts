import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { GRAPHQL_ENDPOINT } from '../../shared/api/graphql-client';
import { MapWorkbenchApi } from './map-workbench-api';

describe('MapWorkbenchApi', () => {
  let api: MapWorkbenchApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GRAPHQL_ENDPOINT, useValue: 'http://api.test/graphql' },
      ],
    });

    api = TestBed.inject(MapWorkbenchApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads map workbench data through GraphQL', () => {
    let layerTitle: string | undefined;
    let requiredRole: string | undefined | null;

    api.loadWorkbench().subscribe((workbench) => {
      layerTitle = workbench.layers[0]?.title;
      requiredRole = workbench.layers[0]?.requiredRole;
    });

    const request = http.expectOne('http://api.test/graphql');

    expect(request.request.method).toBe('POST');
    expect(request.request.body.query).toContain('mapWorkbench');

    request.flush({
      data: {
        mapWorkbench: {
          defaultSelectedLayerIds: ['property-boundaries'],
          defaultSearchTarget: {
            id: 'sollentuna-sjoberg-5-5',
            label: 'SOLLENTUNA SJÖBERG 5:5',
            kind: 'property',
            lonLat: { lon: 17.99449, lat: 59.42447 },
            zoom: 15,
            municipality: 'Sollentuna',
            source: 'local',
          },
          layers: [
            {
              id: 'property-boundaries',
              title: 'Fastighetsgränser',
              renderOrder: 10,
              restricted: false,
              requiredRole: null,
            },
          ],
          features: [],
        },
      },
    });

    expect(layerTitle).toBe('Fastighetsgränser');
    expect(requiredRole).toBeUndefined();
  });

  it('searches targets through GraphQL variables', () => {
    let targetLabel: string | undefined;

    api.searchTargets('Stockholm', 1).subscribe((targets) => {
      targetLabel = targets[0]?.label;
    });

    const request = http.expectOne('http://api.test/graphql');

    expect(request.request.body.variables).toEqual({
      query: 'Stockholm',
      limit: 1,
    });

    request.flush({
      data: {
        searchTargets: [
          {
            id: 'stockholm',
            label: 'Stockholm',
            kind: 'place',
            lonLat: { lon: 18.0686, lat: 59.3293 },
            zoom: 12,
            municipality: 'Stockholm',
            source: 'local',
          },
        ],
      },
    });

    expect(targetLabel).toBe('Stockholm');
  });
});
