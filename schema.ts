import { z } from 'zod';
import type { HttpMethod } from './src/tea/types/config';

/**
 * Schema definition for API endpoints.
 * @template TResponse - The response type from Zod schema
 * @template TParams - The path parameters type from Zod schema
 * @template TBody - The request body type from Zod schema
 * @template TQuery - The query parameters type from Zod schema
 */
export interface ApiEndpointSchema<
  TResponse extends z.ZodType,
  TParams extends z.ZodType<Record<string, string | number>> = z.ZodType<
    Record<string, string | number>
  >,
  TBody extends z.ZodType = z.ZodType,
  TQuery extends z.ZodType = z.ZodType
> {
  /** Zod schema for validating the response */
  response: TResponse;
  /** Optional Zod schema for validating request body */
  body?: TBody;
  /** Optional Zod schema for validating query parameters */
  query?: TQuery;
  /** Optional Zod schema for validating path parameters */
  params?: TParams;
}

/**
 * Definition for an API route.
 */
export interface RouteDefinition<
  TMethod extends HttpMethod,
  TPath extends string,
  TSchema extends ApiEndpointSchema<z.ZodType, z.ZodType, z.ZodType, z.ZodType>
> {
  method: TMethod;
  path: TPath;
  schema: TSchema;
}

/**
 * Schema Definition for Tea Schema
 * @example
 * const userSchema = {
 *  getUsers: {
 *    method:  'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
 *     path: string,
 *     schema: {
 *       response: z.array(
 *       z.object({
 *          id: z.number(),
 *          name: z.string(),
 *          email: z.string().email(),
 *       })
 *      ),
 *       query: z.object({
 *        page: z.number().optional(),
 *        limit: z.number().optional(),
 *      }),
 *     }
 *   }
 * } satisfies TeaSchema
 */
export type TeaSchema = Record<
  string,
  {
    method: HttpMethod;
    path: string;
    schema: ApiEndpointSchema<z.ZodType, z.ZodType, z.ZodType, z.ZodType>;
  }
>;

/**
 * Extracts the response type from a Zod schema
 */
export type InferResponseType<T> = T extends ApiEndpointSchema<
  infer R extends z.ZodType,
  any,
  any,
  any
>
  ? z.infer<R>
  : never;

/**
 * Extracts the path parameters type from a Zod schema
 */
export type InferParamsType<T> = T extends ApiEndpointSchema<
  any,
  infer P extends z.ZodType,
  any,
  any
>
  ? z.infer<P>
  : never;

/**
 * Extracts the request body type from a Zod schema
 */
export type InferBodyType<T> = T extends ApiEndpointSchema<
  any,
  any,
  infer B extends z.ZodType,
  any
>
  ? z.infer<B>
  : never;

/**
 * Extracts the query parameters type from a Zod schema
 */
export type InferQueryType<T> = T extends ApiEndpointSchema<
  any,
  any,
  any,
  infer Q extends z.ZodType
>
  ? z.infer<Q>
  : never;

/**
 * Extracts route keys from a schema definition
 */
export type ExtractRouteKeys<T> = T extends Record<
  infer K,
  RouteDefinition<HttpMethod, string, ApiEndpointSchema<z.ZodType>>
>
  ? K
  : never;
