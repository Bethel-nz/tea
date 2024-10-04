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
 * @example
 *
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
 * const tea = createTea('https://api.example.com', apiSchema);
 *
 * // GET request
 * const posts = await tea('GET /posts');
 *
 * // GET request with params
 * const post = await tea('GET /posts/:id', { params: { id: '1' } });
 *
 * // POST request with body
 * const newPost = await tea('POST /posts', {
 *   body: { title: 'New Post', body: 'This is a new post.' },
 * });
 */
export function createTea<T extends ApiSchema>(
  baseUrl: string,
  schema: T,
  defaultConfig: TeaConfig = {}
): Tea<T> {
  return async <K extends keyof T & string>(
    key: K,
    options: {
      params?: RouteParameters<ExtractPath<K>>;
      body?: InferBody<T[K]> | any;
      query?: InferQuery<T[K]>;
      stringify?: number;
    } & Omit<RequestInit, 'method' | 'body'> = {}
  ): Promise<InferResponse<T[K]>> => {
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
      mergedOptions.body =
        stringify !== undefined ? JSON.stringify(body, null, stringify) : body;
      mergedOptions.headers = {
        'Content-Type': 'application/json',
        ...mergedOptions.headers,
      };
    }

    const response = await fetch(url.toString(), mergedOptions);

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = 'Unable to read error response body';
      }
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorBody}`
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (e: any) {
      throw new Error(`Failed to parse JSON response: ${e.message}`);
    }

    try {
      return (
        endpoint as Endpoint<z.ZodType, z.ZodType, z.ZodType>
      ).response.parse(data);
    } catch (e) {
      if (e instanceof z.ZodError) {
        throw new Error(
          `Response validation failed: ${e.issues
            .map((issue) => {
              `${issue.path}: ${issue.message}`;
            })
            .join(', ')}`
        );
      }
      throw e;
    }
  };
}
