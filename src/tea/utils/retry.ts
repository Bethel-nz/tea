import type { TeaConfig } from '../types/config';

export async function retryRequest<T>(
  fn: () => Promise<T>,
  config: Required<NonNullable<TeaConfig['retry']>>
): Promise<T> {
  let lastError: Error = new Error('Request failed');

  for (let attempt = 0; attempt < config.attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await new Promise((resolve) =>
        setTimeout(resolve, config.delay * (attempt + 1))
      );
    }
  }

  throw lastError;
}
