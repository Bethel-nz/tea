import { z } from 'zod';
import type {
  ApiSchema,
  Endpoint,
  Tea,
  TeaConfig,
  RouteParameters,
  ExtractPath,
  InferBody,
  InferQuery,
  InferResponse,
  HttpMethod,
  ApiResult,
} from './types';

function parseRoute<T extends string>(
  route: T,
  params: RouteParameters<T>
): string {
  return route.replace(/:(\w+)/g, (_, key) =>
    encodeURIComponent(String(params[key as keyof RouteParameters<T>]))
  );
}

/**
 * Creates a `tea` function that takes in an API schema and returns a type-safe
 * fetcher for making API requests.
 *
 * @param baseUrl - The base URL for the API.
 * @param schema - The API schema defining endpoints and their types.
 * @param defaultConfig - Optional default configuration for all requests.
 * @returns A type-safe function for making API requests.
 *
 * @example
 * const postSchema = z.object({
 *   id: z.number(),
 *   title: z.string(),
 *   body: z.string(),
 * });
 *
 * const apiSchema = {
 *   'GET /posts': {
 *     response: z.array(postSchema),
 *   },
 *   'GET /posts/:id': {
 *     response: postSchema,
 *   },
 *   'POST /posts': {
 *     response: postSchema,
 *     body: z.object({
 *       title: z.string(),
 *       body: z.string(),
 *     }),
 *   },
 * } as const;
 *
 * const tea = createTea('https://jsonplaceholder.typicode.com', apiSchema);
 *
 * // GET request
 * const [error, posts] = await tea('GET /posts');
 * if (error) {
 *   console.error('Error fetching posts:', error);
 * } else {
 *   console.log('Posts:', posts);
 * }
 *
 * // GET request with params
 * const [error, post] = await tea('GET /posts/:id', { params: { id: '1' } });
 * if (error) {
 *   console.error('Error fetching post:', error);
 * } else {
 *   console.log('Post:', post);
 * }
 *
 * // POST request with body
 * const [error, newPost] = await tea('POST /posts', {
 *   body: { title: 'New Post', body: 'This is a new post.' },
 *   stringify: true, // Pretty print the JSON body
 * });
 * if (error) {
 *   console.error('Error creating post:', error);
 * } else {
 *   console.log('Created post:', newPost);
 * }
 *
 * @remarks
 * The `tea` function returns a Promise that resolves to an `ApiResult` tuple.
 * The first element of the tuple is either an Error object (if an error occurred)
 * or null (if the request was successful). The second element is either the
 * parsed response data (if successful) or null (if an error occurred).
 *
 * The `stringify` option in the request config can be set to `true` to pretty-print
 * the JSON body of POST, PUT, and PATCH requests.
 */
export function createTea<T extends ApiSchema>(
  baseUrl: string,
  schema: T,
  defaultConfig: TeaConfig = {}
): Tea<T> {
  /**
   * @param key - The API endpoint to call.
   * @param options - The options for the API call.
   * @returns A Promise that resolves to an `ApiResult` tuple.
   */
  return async <K extends keyof T & string>(
    key: K,
    options: {
      params?: RouteParameters<ExtractPath<K>>;
      body?: InferBody<T[K]> | any;
      query?: InferQuery<T[K]>;
      stringify?: boolean;
    } & Omit<RequestInit, 'method' | 'body'> = {}
  ): Promise<ApiResult<InferResponse<T[K]>>> => {
    const endpoint = schema[key];
    const { params, body, query, stringify, ...requestOptions } = options;

    const [methodStr, ...pathParts] = key.split(' ');
    const method = methodStr as HttpMethod;
    const path = pathParts.join(' ');

    let url = new URL(
      parseRoute(path, params || ({} as RouteParameters<typeof path>)),
      baseUrl
    );

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const mergedOptions: RequestInit = {
      ...defaultConfig,
      ...requestOptions,
      method,
      headers: {
        ...defaultConfig.headers,
        ...requestOptions.headers,
      },
    };

    if (['POST', 'PUT', 'PATCH'].includes(method) && body !== undefined) {
      mergedOptions.body = stringify ? JSON.stringify(body, null, 2) : body;
      mergedOptions.headers = {
        ...mergedOptions.headers,
        'Content-Type': 'application/json',
      };
    }

    try {
      const response = await fetch(url.toString(), mergedOptions);

      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.json();
        } catch (e) {
          errorBody = 'Unable to read error response body';
        }
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${JSON.stringify(
            errorBody,
            null,
            2
          )}`
        );
      }
      const data = await response.json();

      const result = (
        endpoint as Endpoint<z.ZodType, z.ZodType, z.ZodType>
      ).response.parse(data);
      return [null, result] as [null, InferResponse<T[K]>];
    } catch (error) {
      return [error instanceof Error ? error : new Error(String(error)), null];
    }
  };
}
