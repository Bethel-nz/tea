# Examples

## Basic Usage

```typescript
import { z } from 'zod';
import { createTea } from '../tea/core';
import type { TeaSchema } from 'tea/schema';

const userSchema = {
  getUsers: {
    method: 'GET',
    path: '/user',
    schema: {
      response: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          email: z.string().email(),
        })
      ),
      query: z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
      }),
    },
  },
  getUser: {
    method: 'GET' as const,
    path: '/users/:id',
    schema: {
      response: z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
      }),
      params: z.object({
        id: z.string(),
      }),
    },
  },
  createUser: {
    method: 'POST' as const,
    path: '/users',
    schema: {
      response: z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
      }),
      body: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    },
  },
} satisfies TeaSchema;

const tea = createTea('https://jsonplaceholder.typicode.com', userSchema);

async function basicExample() {
  try {
    // Get all users with query params
    const users = await tea('getUsers', {
      query: { page: 1, limit: 5 },
    });
    console.log('Users:', users);

    // Get single user with path params
    const user = await tea('getUser', {
      params: { id: '1' }, // Type-safe params
    });
    console.log('Single user:', user);

    // Create user with body
    const newUser = await tea('createUser', {
      body: {
        // Type-safe body
        name: 'John Doe',
        email: 'johndoe@email.com',
      },
    });
    console.log('Created user:', newUser);
  } catch (error) {
    console.error('Error:', error);
  }
}

basicExample();
```

## With Interceptors

```typescript
import { z } from 'zod';
import { createTea, invalidateQueries } from 'tea/core';

const userSchema = {
  getUsers: {
    method: 'GET',
    path: '/users',
    schema: {
      response: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          email: z.string().email(),
        })
      ),
      query: z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
      }),
    },
    cache: true,
  },
  getPhotos: {
    method: 'GET',
    path: '/photos',
    schema: {
      response: z.array(
        z.object({
          id: z.number(),
          albumId: z.number(),
          title: z.string(),
          url: z.string().url(),
          thumbnailUrl: z.string().url(),
        })
      ),
      query: z.object({
        _limit: z.number().optional(),
      }),
    },
    cache: true,
  },
} as const;

const tea = createTea('https://jsonplaceholder.typicode.com', userSchema, {
  interceptors: {
    request: (config) => {
      // Log the request details
      console.log('Request:', {
        method: config.method,
      });
      return {
        ...config,
        headers: {
          ...config.headers,
          'X-Client-ID': 'tea-client',
          'X-Request-Time': new Date().toISOString(),
        },
      };
    },
    response: (data) => {
      // Log response size
      console.log('📦 Response size:', JSON.stringify(data).length, 'bytes');
      return data;
    },
  },
  retry: {
    attempts: 3,
    sleep: 1000,
  },
});

async function interceptorExample() {
  try {
    // Get users with interceptors and caching
    const users = await tea('getUsers', {
      query: { page: 1, limit: 2 },
    });
    console.log('Users:', users);

    // Get photos with cache configuration
    const photos = await tea('getPhotos', {
      query: { _limit: 2 },
    });
    console.log('Photos:', photos);
  } catch (error) {
    console.error('Error:', error);
  }
}

interceptorExample();
```

## With Cache

```typescript
import { z } from 'zod';
import { createTea, invalidateQueries } from 'tea/core';
import type { TeaSchema } from 'tea/schema';

const cryptoSchema = {
  getBitcoinPrice: {
    method: 'GET' as const,
    path: '/v2/cryptocurrency/quotes/latest',
    schema: {
      response: z.object({
        status: z.object({
          timestamp: z.string(),
          error_code: z.number(),
          error_message: z.null(),
          elapsed: z.number(),
          credit_count: z.number(),
          notice: z.null(),
        }),
        data: z.object({
          BTC: z
            .array(
              z.object({
                id: z.number(),
                name: z.string(),
                symbol: z.string(),
                quote: z.object({
                  USD: z.object({
                    price: z.number(),
                    last_updated: z.string(),
                    percent_change_24h: z.number(),
                    market_cap: z.number(),
                  }),
                }),
              })
            )
            .transform((btcs) => btcs[0]), // Take first BTC (main Bitcoin)
        }),
      }),
      query: z.object({
        symbol: z.literal('BTC'),
        convert: z.literal('USD'),
      }),
    },
    cache: true,
  },
} satisfies TeaSchema;

const tea = createTea('https://pro-api.coinmarketcap.com', cryptoSchema, {
  cache: {
    strategy: 'memory', // supports memory or local-storage
    ttl: 10 * 1000, // 10 seconds
  },
  interceptors: {
    request: (config) => {
      return {
        ...config,
        headers: {
          ...config.headers,
          'X-CMC_PRO_API_KEY': '6eaf6377-<Rest-Api-Key-From-Coin-Market-Cap>',
        },
      };
    },
    response: (data) => {
      // Log response size
      console.log(
        '📦 Response size:',
        JSON.stringify(data).length.toLocaleString(),
        'bytes'
      );
      return data;
    },
  },
});

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cachedExample() {
  try {
    // First request - will fetch from API
    console.log('First request (from API):');
    const firstPrice = await tea('getBitcoinPrice', {
      query: {
        symbol: 'BTC',
        convert: 'USD',
      },
    });
    console.log(
      'Bitcoin price:',
      firstPrice.data.BTC.quote.USD.price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })
    );
    console.log(
      'Last updated:',
      new Date(firstPrice.data.BTC.quote.USD.last_updated).toLocaleTimeString()
    );
    console.log(
      '24h Change:',
      `${firstPrice.data.BTC.quote.USD.percent_change_24h.toFixed(2)}%`
    );

    // Wait 5 seconds just for demo
    console.log('\n⏳ Waiting 10 seconds...');
    await sleep(5000);

    // Second request - should use cache
    console.log('\n Second request (from cache):');
    const cachedPrice = await tea('getBitcoinPrice', {
      query: {
        symbol: 'BTC',
        convert: 'USD',
      },
    });
    console.log(
      'Bitcoin price:',
      cachedPrice.data.BTC.quote.USD.price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })
    );
    console.log(
      'Last updated:',
      new Date(cachedPrice.data.BTC.quote.USD.last_updated).toLocaleTimeString()
    );
    console.log(
      '24h Change:',
      `${cachedPrice.data.BTC.quote.USD.percent_change_24h.toFixed(2)}%`
    );

    // Wait 15 seconds
    console.log('\n Waiting 15 seconds...');
    await sleep(15000);

    // Invalidate and refetch
    console.log('\n🔄 Invalidating cache and refetching...');
    await invalidateQueries('getBitcoinPrice');
    const freshPrice = await tea('getBitcoinPrice', {
      query: {
        symbol: 'BTC',
        convert: 'USD',
      },
    });
    console.log(
      'Bitcoin price:',
      freshPrice.data.BTC.quote.USD.price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })
    );
    console.log(
      'Last updated:',
      new Date(freshPrice.data.BTC.quote.USD.last_updated).toLocaleTimeString()
    );
    console.log(
      '24h Change:',
      `${freshPrice.data.BTC.quote.USD.percent_change_24h.toFixed(2)}%`
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
  }
}
```
