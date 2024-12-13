import type { z } from 'zod';
import type { ApiEndpointSchema, RouteDefinition } from '../../../schema';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type CacheStrategy = 'none' | 'memory' | 'local-storage';

/**
 * Configuration options for the Tea API client
 * @interface TeaConfig
 *
 * Example usage:
 *
 * const teaConfig: TeaConfig = {
 * 	baseUrl: 'https://api.example.com',
 * 	cache: {
 * 		strategy: 'memory',
 * 		ttl: 30000,
 * 	},
 * 	interceptors: {
 * 		request: (config) => {
 *   		config.headers.Authorization = 'Bearer YOUR_TOKEN';
 *   		return config;
 * 		},
 * 	},
 * 	retry: {
 * 		attempts: 3,
 * 		delay: 500,
 * 		},
 * 	};
 * @see TeaRequestConfig
 * @see CacheStrategy
 */
export interface TeaConfig {
  /**
   * The base URL for API requests
   *
   * @type{string}
   */
  baseUrl: string;
  /**
   * Cache configuration options
   * @type{Object}
   */
  cache?: {
    /**
     * The cache strategy to use 'memory' or 'local-storage'
     * @type{CacheStrategy}
     */
    strategy?: CacheStrategy;
    /**
     * The time before cached data becomes stale, in milliseconds
     * @type{number}
     */
    staleTime?: number;
    /**
     * Whether to refetch cached responses when the component mounts.
     * @type {boolean}
     */
    refetchOnMount?: boolean;
    /**
     * Whether to refetch cached responses when the window regains focus.
     * @type {boolean}
     */
    refetchOnWindowFocus?: boolean;
  };
  /**
   * Interceptor functions for modifying requests and responses.
   * @type {Object}
   */
  interceptors?: {
    /**
     * A function to modify the request configuration before sending.
     *
     * @param {TeaRequestConfig} config
     * @returns {TeaRequestConfig}
     */
    request?: (config: TeaRequestConfig) => TeaRequestConfig;
    /**
     * A function to modify the response data after receiving.
     *
     * @param {T} response
     * @returns {T}
     */
    response?: <T>(response: T) => T;
  };
  /**
   * Retry configuration options.
   *
   * @type {Object}
   */
  retry?: {
    /**
     * The number of retry attempts to make before failing.
     *
     * @type {number}
     */
    attempts?: number;

    /**
     * The delay between retry attempts, in milliseconds.
     *
     * @type {number}
     */
    delay?: number;
  };
}

export interface TeaRequestConfig {
  method: HttpMethod;
  url?: string;
  body?: BodyInit | null;
  headers?: Record<string, string>;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  integrity?: string;
  keepalive?: boolean;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  signal?: AbortSignal | null;
  window?: null;
}

export type Routes = Record<
  string,
  RouteDefinition<HttpMethod, string, ApiEndpointSchema<any>>
>;

export type ExtractRouteKeys<T extends Routes> = keyof T;
export type QueryKey<T extends Routes> = ExtractRouteKeys<T> | 'all';
