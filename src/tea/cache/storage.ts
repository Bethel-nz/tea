import type { CacheStorage, CacheEntry } from './types';

export class MemoryStorage<T> implements CacheStorage<T> {
  private storage = new Map<string, CacheEntry<T>>();

  get(key: string): CacheEntry<T> | null {
    return this.storage.get(key) ?? null;
  }

  set(key: string, value: CacheEntry<T>): void {
    this.storage.set(key, value);
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  forEach(callback: (entry: CacheEntry<T>, key: string) => void): void {
    this.storage.forEach((entry, key) => callback(entry, key));
  }
}

export class LocalStorage<T> implements CacheStorage<T> {
  private prefix = 'tea-cache:';
  private isClient = typeof window !== 'undefined';

  get(key: string): CacheEntry<T> | null {
    if (!this.isClient) return null;
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  set(key: string, value: CacheEntry<T>): void {
    if (!this.isClient) return;
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.warn('LocalStorage set failed:', error);
    }
  }

  delete(key: string): void {
    if (!this.isClient) return;
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (!this.isClient) return;
    Object.keys(localStorage)
      .filter((key) => key.startsWith(this.prefix))
      .forEach((key) => localStorage.removeItem(key));
  }

  forEach(callback: (entry: CacheEntry<T>, key: string) => void): void {
    if (!this.isClient) return;

    Object.keys(localStorage)
      .filter((key) => key.startsWith(this.prefix))
      .forEach((key) => {
        const item = this.get(key.slice(this.prefix.length));
        if (item) {
          callback(item, key.slice(this.prefix.length));
        }
      });
  }
}
