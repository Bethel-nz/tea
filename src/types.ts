import { z } from 'zod';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RouteParameter = string | number;

export type RouteParameters<T extends string> = string extends T
  ? Record<string, RouteParameter>
  : T extends `${infer Start}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof RouteParameters<Rest>]: RouteParameter }
  : T extends `${infer Start}:${infer Param}`
  ? { [K in Param]: RouteParameter }
  : {};

export type Endpoint<
  TResponse extends z.ZodType,
  TBody extends z.ZodType | undefined = undefined,
  TQuery extends z.ZodType | undefined = undefined
> = {
  response: TResponse;
  body?: TBody;
  query?: TQuery;
};

export type ApiSchema = {
  [K in `${HttpMethod} ${string}`]: Endpoint<
    z.ZodType,
    z.ZodType | undefined,
    z.ZodType | undefined
  >;
};

export type InferResponse<T> = T extends Endpoint<infer R, any, any>
  ? z.infer<R>
  : never;
export type InferBody<T> = T extends Endpoint<any, infer B, any>
  ? B extends z.ZodType
    ? z.infer<B>
    : any // Allow any JSON-serializable data if no schema is provided
  : never;
export type InferQuery<T> = T extends Endpoint<any, any, infer Q>
  ? Q extends z.ZodType
    ? z.infer<Q>
    : never
  : never;

export type TeaConfig = Omit<RequestInit, 'method' | 'body'>;

// Update the ApiResult type
export type ApiResult<T> = [Error, null] | [null, T];

// Modify the Tea type to return ApiResult
export type Tea<T extends ApiSchema> = <K extends keyof T & string>(
  key: K,
  options?: {
    params?: RouteParameters<ExtractPath<K>>;
    body?: InferBody<T[K]>;
    query?: InferQuery<T[K]>;
    stringify?: boolean;
  } & Omit<RequestInit, 'method' | 'body'>
) => Promise<ApiResult<InferResponse<T[K]>>>;

export type ExtractPath<T extends string> = T extends `${HttpMethod} ${infer P}`
  ? P
  : never;
export type ExtractMethod<T extends string> = T extends `${infer M} ${string}`
  ? M
  : never;
