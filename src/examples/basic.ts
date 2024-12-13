import { z } from 'zod';
import { createTea } from '../../core';
import type { TeaRequestConfig } from '../tea/types/config';
import type { TeaSchema } from '../../schema';

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
				}),
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
