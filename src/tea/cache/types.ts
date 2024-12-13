import type { z } from 'zod';

export type CacheState<TData> = {
  data: TData;
  timestamp: number;
  status: 'fresh' | 'stale';
};

export interface CacheOptions {
  /**
   * Time in milliseconds before data becomes stale
   */
  staleTime?: number;
  /**
   * Whether to refetch when component mounts
   */
  refetchOnMount?: boolean;
  /**
   * Whether to refetch when window regains focus
   */
  refetchOnWindowFocus?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CacheStorage<T> {
  get(key: string): CacheEntry<T> | null;
  set(key: string, value: CacheEntry<T>): void;
  delete(key: string): void;
  clear(): void;
  forEach(callback: (entry: CacheEntry<T>, key: string) => void): void;
}
