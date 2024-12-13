import type { z } from 'zod';
import type {
  TeaConfig,
  Routes,
  TeaRequestConfig,
} from './src/tea/types/config';
import type {
  InferResponseType,
  InferBodyType,
  InferQueryType,
} from './schema';
import type { CacheOptions } from './src/tea/cache/types';
import { CacheManager } from './src/tea/cache/manager';
import { parseRoute, appendQueryParams } from './src/tea/utils/url';
import { retryRequest } from './src/tea/utils/retry';

let globalCacheManager: Map<string, CacheManager<unknown>> | null = null;
let currentSchema: Routes | null = null;

// Type to extract route names from schema
type ExtractRouteNames<T> = T extends Routes ? keyof T : never;
type ValidRouteKey<T> = T extends Routes ? ExtractRouteNames<T> | 'all' : never;

/**
 * Creates a type-safe API client with caching and interceptor capabilities.
 *
 * @param baseUrl - The base URL for all API requests
 * @param routes - The route definitions for the API
 * @param config - Optional configuration for caching, interceptors, and retry behavior
 *
 * @example
 * ```typescript
 * const userSchema = {
 *   getUsers: {
 *     method: 'GET' as const,
 *     path: '/users',
 *     schema: {
 *       response: z.array(userSchema),
 *       query: z.object({ limit: z.number().optional() })
 *     },
 *     cache: true
 *   }
 * } as const;
 *
 * // Basic usage
 * const tea = createTea('https://api.example.com', userSchema);
 *
 * // With configuration
 * const teaWithConfig = createTea('https://api.example.com', userSchema, {
 *   cache: {
 *     strategy: 'memory',
 *     ttl: 60 * 1000
 *   },
 *   retry: {
 *     attempts: 3,
 *     delay: 1000
 *   }
 * });
 *
 * // Making requests
 * const users = await tea('getUsers', { query: { limit: 10 } });
 * ```
 */
export function createTea<TRoutes extends Routes>(
  baseUrl: string,
  routes: TRoutes,
  config: Omit<TeaConfig, 'baseUrl'> = {}
) {
  const cacheManagers = new Map<string, CacheManager<unknown>>();
  globalCacheManager = cacheManagers;
  currentSchema = routes;

  const fullConfig: TeaConfig = {
    baseUrl,
    ...config,
  };

  return async function request<
    TRouteName extends keyof TRoutes,
    TRoute extends TRoutes[TRouteName]
  >(
    routeName: TRouteName,
    options: {
      params?: Record<string, string | number>;
      body?: InferBodyType<TRoute['schema']>;
      query?: InferQueryType<TRoute['schema']>;
    } & Omit<RequestInit, 'method' | 'body'>,
    cache = true
  ): Promise<InferResponseType<TRoute['schema']>> {
    const route = routes[routeName];
    const { params, body, query, ...requestOptions } = options;

    // Cache handling
    if (fullConfig.cache || cache) {
      const cacheKey = JSON.stringify({ routeName, params, query });
      let cacheManager = cacheManagers.get(cacheKey);

      if (!cacheManager) {
        cacheManager = new CacheManager(
          fullConfig.cache?.strategy ?? 'memory',
          {
            staleTime: fullConfig.cache?.staleTime ?? 0,
            refetchOnMount: fullConfig.cache?.refetchOnMount ?? false,
            refetchOnWindowFocus: fullConfig.cache?.refetchOnWindowFocus ?? false,
          },
          async (key) => {
            await request(routeName, options);
          }
        );
        cacheManagers.set(cacheKey, cacheManager);
      }

      const cached = cacheManager.get(cacheKey);
      if (cached && cached.status === 'fresh') {
        return cached.data as InferResponseType<TRoute['schema']>;
      }
    }

    const executeRequest = async () => {
      const url = new URL(parseRoute(route.path, params), baseUrl);
      appendQueryParams(url, query!);

      const requestInit: TeaRequestConfig = {
        ...requestOptions,
        method: route.method,
        headers: {
          'Content-Type': 'application/json',
          ...(requestOptions.headers as Record<string, string>),
        },
        body: body ? JSON.stringify(body) : null,
      };

      const finalRequest =
        fullConfig.interceptors?.request?.(requestInit) ?? requestInit;
      const response = await fetch(url.toString(), finalRequest as RequestInit);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData
          ? JSON.stringify(errorData, null, 2)
          : `HTTP Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Apply response interceptor
      const processedData = fullConfig.interceptors?.response?.(data) ?? data;

      // Validate response
      const validatedData = route.schema.response.parse(processedData);

      // Cache the response if caching is enabled
      if (fullConfig.cache || cache) {
        const cacheKey = JSON.stringify({ routeName, params, query });
        const cacheManager = cacheManagers.get(cacheKey);
        cacheManager?.set(cacheKey, validatedData);
      }

      return validatedData;
    };

    // Execute with retry if configured
    if (fullConfig.retry) {
      return retryRequest(executeRequest, {
        attempts: fullConfig.retry.attempts ?? 3,
        delay: fullConfig.retry.delay ?? 1000,
      });
    }

    return executeRequest();
  };
}

/**
 * Invalidates cached queries and triggers a refetch.
 * Can invalidate a specific endpoint or all cached queries.
 *
 * @param queryKey - The endpoint to invalidate or 'all' to invalidate everything
 *
 * @example
 * ```typescript
 * // Invalidate specific endpoint
 * await invalidateQueries('getUsers');
 *
 * // Invalidate all cached queries
 * await invalidateQueries('all');
 * ```
 */
export async function invalidateQueries<
  T extends NonNullable<typeof currentSchema>
>(queryKey: ValidRouteKey<T>): Promise<void> {
  if (!globalCacheManager || !currentSchema) return;

  if (queryKey === 'all') {
    for (const [, manager] of globalCacheManager.entries()) {
      await manager.invalidateAndRefetch();
      await manager.clear();
    }
  } else {
    const manager = globalCacheManager.get(queryKey as string);
    if (manager) {
      await manager.invalidateAndRefetch();
      await manager.clear();
    }
  }
}
