import { createTea } from './tea';
import { z } from 'zod';

const postSchema = z.object({
  id: z.number(),
  userId: z.number(),
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
    }),
  },
  'PUT /posts/:id': {
    response: postSchema,
    // No body schema defined, allowing any JSON-serializable data
  },
} as const;

const tea = createTea('https://jsonplaceholder.typicode.com', apiSchema);

// Example usage
async function fetchPosts() {
  const [error, posts] = await tea('GET /posts', {
    headers: { 'Custom-Header': 'value' },
  });
  if (error) {
    console.error('Error fetching posts:\n', error.message);
  } else {
    console.log('All posts:', posts);
  }
}

async function fetchSinglePost(id: string) {
  const [error, post] = await tea('GET /posts/:id', {
    params: { id },
  });
  if (error) {
    console.error('Error fetching single post:', error);
  } else {
    console.log('Single post:', post.title);
  }
}

async function createPost() {
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
}

async function updatePost() {
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
    console.error('Error updating post:\n', error.message);
  } else {
    console.log('Updated post:', updatedPost);
  }
}

// Execute the functions
fetchPosts();
fetchSinglePost('1');
createPost();
updatePost();
