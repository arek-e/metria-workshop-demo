import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export const GRAPHQL_ENDPOINT = new InjectionToken<string>('GRAPHQL_ENDPOINT', {
  providedIn: 'root',
  factory: () => defaultGraphqlEndpoint(),
});

interface GraphqlError {
  readonly message: string;
}

interface GraphqlResponse<TData> {
  readonly data?: TData;
  readonly errors?: readonly GraphqlError[];
}

@Injectable({ providedIn: 'root' })
export class GraphqlClient {
  private readonly http = inject(HttpClient);
  private readonly endpoint = inject(GRAPHQL_ENDPOINT);

  query<TData>(query: string, variables: Record<string, unknown> = {}): Observable<TData> {
    return this.http
      .post<GraphqlResponse<TData>>(this.endpoint, {
        query,
        variables,
      })
      .pipe(
        map((response) => {
          if (response.errors?.length) {
            throw new Error(response.errors.map((error) => error.message).join('\n'));
          }

          if (!response.data) {
            throw new Error('GraphQL response did not include data.');
          }

          return response.data;
        }),
      );
  }
}

function defaultGraphqlEndpoint(): string {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:3000/graphql';
  }

  const { hostname, origin, port, protocol } = window.location;
  if ((hostname === '127.0.0.1' || hostname === 'localhost') && port !== '3000') {
    return `${protocol}//${hostname}:3000/graphql`;
  }

  return `${origin}/graphql`;
}
