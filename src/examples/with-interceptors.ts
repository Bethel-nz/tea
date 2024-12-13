import { z } from 'zod';
import { createTea, invalidateQueries } from '../../core';

const userSchema = {
	getUsers: {
		method: 'GET' as const,
		path: '/users',
		schema: {
			response: z.array(
				z.object({
					id: z.number(),
					name: z.string(),
					email: z.string().email(),
				}),
			),
			query: z.object({
				page: z.number().optional(),
				limit: z.number().optional(),
			}),
		},
		cache: true,
	},
	getPhotos: {
		method: 'GET' as const,
		path: '/photos',
		schema: {
			response: z.array(
				z.object({
					id: z.number(),
					albumId: z.number(),
					title: z.string(),
					url: z.string().url(),
					thumbnailUrl: z.string().url(),
				}),
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
			console.log('🚀 Request:', {
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
		delay: 1000,
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

		// await invalidateQueries('getUsers');
		// await invalidateQueries('all');
	} catch (error) {
		console.error('Error:', error);
	}
}

interceptorExample();
