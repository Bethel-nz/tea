# Tea

`tea` is a lightweight, type-safe API client builder for TypeScript, powered by [Zod](https://github.com/colinhacks/zod) for runtime validation. It provides a simple way to define your API schema and create a fully typed client for making HTTP requests.

## Installation

```shell
npm i @bethel-nz/tea

bun add @bethel-nz/tea

yarn add @bethel-nz/tea
```

## Features

- Define your API schema using Zod for both request and response validation
- Fully typed responses and request parameters
- Support for path parameters, query parameters, and request bodies
- Automatic parsing of JSON responses
- Custom headers and request options
- Caching with query invalidation

## Usage

### Defining your API schema

First, define your API schema using Zod schemas:

```typescript
import { z } from 'zod';
import { createTea } from '@bethel-nz/tea/core';
import type { TeaSchema } from '@bethel-nz/tea/schema';

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
  },
  //...other schema
} satisfies TeaSchema;
```

### Creating the client

Create your API client using `createTea`:

```typescript
const tea = createTea('https://jsonplaceholder.typicode.com', userSchema);

```

### Making requests

Now you can make fully typed requests to your API:

```typescript
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
```

see [Examples Here](./src/examples)

## Why Tea?

Tea provides a balance between simplicity and type safety. It allows you to:

1. Define your API schema in one place
2. Get full type inference for requests and responses
3. Validate responses at runtime using Zod
4. Keep your API client code clean and concise

It's a simple API for building a type and runtime-safe fetcher function using Zod schemas.

## Inspiration / Alternatives

- [Zod Fetch](https://github.com/mattpocock/zod-fetch)
- [Typesafe Fetch](https://github.com/aurbano/typesafe-fetch)
- [Zod](https://github.com/colinhacks/zod)
- [Ky](https://github.com/sindresorhus/ky) - a more feature-rich alternative but isn't typed

## License

MIT
