import type {
  CacheState,
  CacheOptions,
  CacheEntry,
  CacheStorage,
} from './types';
import { MemoryStorage, LocalStorage } from './storage';
import type { CacheStrategy } from '../types/config';

export class CacheManager<TData> {
  private cache: CacheStorage<TData>;
  private options: Required<CacheOptions>;
  private refetchCallback?: (key: string) => Promise<void>;
  private strategy: 'memory' | 'none' | 'local-storage';

  constructor(
    strategy: CacheStrategy = 'memory',
    options: CacheOptions = {},
    onRefetch?: (key: string) => Promise<void>
  ) {
    this.strategy = strategy;
    this.cache =
      strategy === 'local-storage'
        ? new LocalStorage<TData>()
        : new MemoryStorage<TData>();

    this.options = {
      staleTime: 0,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      ...options,
    };

    this.refetchCallback = onRefetch;

    if (this.options.refetchOnWindowFocus && typeof window !== 'undefined') {
      window.addEventListener('focus', this.refetchAllStaleEntries.bind(this));
    }
  }

  private async refetchAllStaleEntries(): Promise<void> {
    if (!this.refetchCallback) return;

    this.cache.forEach((entry, key) => {
      if (this.isStale({ ...entry, status: 'fresh' })) {
        if (!this.refetchCallback) return;
        void this.refetchCallback(key);
      }
    });
  }

  private isStale(entry: CacheState<TData>): boolean {
    return Date.now() - entry.timestamp > this.options.staleTime;
  }

  set(key: string, data: TData): void {
    const newEntry: CacheEntry<TData> = {
      data,
      timestamp: Date.now(),
    };

    this.cache.set(key, newEntry);
  }

  get(key: string): CacheState<TData> | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    return {
      ...entry,
      status: this.isStale({ ...entry, status: 'fresh' }) ? 'stale' : 'fresh',
    };
  }

  invalidate(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.set(key, entry);
    }
  }

  invalidateAll(): void {
    this.cache.forEach((entry, key) => {
      this.cache.set(key, entry);
    });
  }

  clear(): void {
    this.cache =
      this.strategy === 'local-storage'
        ? new LocalStorage<TData>()
        : new MemoryStorage<TData>();
  }

  async invalidateAndRefetch(): Promise<void> {
    const entries: Array<[string, CacheEntry<TData>]> = [];
    this.cache.forEach((entry, key) => entries.push([key, entry]));

    // First, mark all entries as stale
    for (const [key, entry] of entries) {
      const newEntry: CacheEntry<TData> = {
        ...entry,
        timestamp: Date.now(),
      };
      this.cache.set(key, newEntry);
    }

    // Then, trigger refetch for all entries
    if (this.refetchCallback) {
      for (const [key] of entries) {
        await this.refetchCallback(key);
      }
    }
  }
}
