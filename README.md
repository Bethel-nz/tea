# Tea

`tea` is a lightweight, type-safe API client builder for TypeScript, powered by [Zod](https://github.com/colinhacks/zod) for runtime validation. It provides a simple way to define your API schema and create a fully typed client for making HTTP requests.

## Features

- Define your API schema using Zod for both request and response validation
- Fully typed responses and request parameters
- Support for path parameters, query parameters, and request bodies
- Automatic parsing of JSON responses
- Custom headers and request options
- Abstracted error handling with tuple return type

## Usage

### Defining your API schema

First, define your API schema using Zod schemas:

```typescript
import { z } from 'zod';
import { createTea } from 'tea';

const postSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
});

const apiSchema = {
  'GET /posts': {
    response: z.array(postSchema),
  },
  'GET /posts/:id': {
    response: postSchema,
  },
  'POST /posts': {
    response: postSchema,
    body: z.object({
      userId: z.number(),
      title: z.string(),
      body: z.string(),
    }), // optionally defined body schema
    stringify: true, // stringify the body - defaults to false
  },
} as const;
```

### Creating the client

Create your API client using `createTea`:

```typescript
const tea = createTea('https://jsonplaceholder.typicode.com', apiSchema);
```

### Making requests

Now you can make fully typed requests to your API:

```typescript
// GET request

const [error, posts] = await tea('GET /posts', {
  headers: { 'Custom-Header': 'value' },
});
if (error) {
  console.error('Error fetching posts:', error.message);
} else {
  console.log('All posts:', posts);
}

// GET request with path parameter

const [error, post] = await tea('GET /posts/:id', {
  params: { id },
});
if (error) {
  console.error('Error fetching single post:', error);
} else {
  console.log('Single post:', post.title);
}

// POST request with body

const [error, newPost] = await tea('POST /posts', {
  body: {
    userId: 1,
    title: 'foo',
    body: 'bar',
  },
  stringify: true,
});
if (error) {
  console.error('Error creating post:', error.message);
} else {
  console.log('Created post:', newPost);
}

// PUT request with path parameter and body

const [error, updatedPost] = await tea('PUT /posts/:id', {
  params: { id: '3' },
  body: {
    title: 'Updated Title',
    body: 'Hello world',
    userId: 1,
  },
  stringify: true,
});
if (error) {
  console.error('Error updating post:', error.message);
} else {
  console.log('Updated post:', updatedPost);
}
```

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
