import { z } from 'zod';
import { createTea, invalidateQueries } from '../../core';

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
							}),
						)
						.transform((btcs) => btcs[0]), // Take first BTC (main Bitcoin)
				}),
			}),
			query: z.object({
				symbol: z.literal('BTC'),
				convert: z.literal('USD'),
			}),
		},
	},
} as const;

const tea = createTea('https://pro-api.coinmarketcap.com', cryptoSchema, {
	cache: {
		strategy: 'memory',
		staleTime: 10 * 1000, // 30 seconds
	},
	interceptors: {
		request: (config) => {
			return {
				...config,
				headers: {
					...config.headers,
					'X-CMC_PRO_API_KEY': '6eaf6377-3250-47a1-8bea-848efb3151cc',
				},
			};
		},
		response: (data) => {
			// Log response size
			console.log('📦 Response size:', JSON.stringify(data).length.toLocaleString(), 'bytes');
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
		const firstPrice = await tea(
			'getBitcoinPrice',
			{
				query: {
					symbol: 'BTC',
					convert: 'USD',
				},
			},
			true, // Enable cache
		);
		console.log(
			'Bitcoin price:',
			firstPrice.data.BTC.quote.USD.price.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
			}),
		);
		console.log(
			'Last updated:',
			new Date(firstPrice.data.BTC.quote.USD.last_updated).toLocaleTimeString(),
		);
		console.log('24h Change:', `${firstPrice.data.BTC.quote.USD.percent_change_24h.toFixed(2)}%`);

		// Wait 10 seconds
		console.log('\n Waiting 10 seconds...');
		await sleep(10000);

		// Second request - should use cache
		console.log('\n Second request (should use cache):');
		const cachedPrice = await tea(
			'getBitcoinPrice',
			{
				query: {
					symbol: 'BTC',
					convert: 'USD',
				},
			},
			true, // Use cache
		);
		console.log(
			'Bitcoin price:',
			cachedPrice.data.BTC.quote.USD.price.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
			}),
		);
		console.log(
			'Last updated:',
			new Date(cachedPrice.data.BTC.quote.USD.last_updated).toLocaleTimeString(),
		);
		console.log('24h Change:', `${cachedPrice.data.BTC.quote.USD.percent_change_24h.toFixed(2)}%`);

		// Wait 30 seconds
		console.log('\n Waiting 30 seconds...');
		await sleep(30000);

		// Invalidate and refetch
		console.log('\n Invalidating cache and refetching...');
		// await invalidateQueries('getBitcoinPrice');
		const freshPrice = await tea(
			'getBitcoinPrice',
			{
				query: {
					symbol: 'BTC',
					convert: 'USD',
				},
			},
			true, // Re-enable cache for future requests
		);
		console.log(
			'Bitcoin price:',
			freshPrice.data.BTC.quote.USD.price.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
			}),
		);
		console.log(
			'Last updated:',
			new Date(freshPrice.data.BTC.quote.USD.last_updated).toLocaleTimeString(),
		);
		console.log('24h Change:', `${freshPrice.data.BTC.quote.USD.percent_change_24h.toFixed(2)}%`);
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error:', error.message);
		} else {
			console.error('Unknown error:', error);
		}
	}
}

cachedExample();
