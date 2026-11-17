// Proxy API requests to the backend worker
export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Only proxy API requests
  if (!url.pathname.startsWith('/api/')) {
    return context.next();
  }

  // Forward request to API worker
  const apiUrl = `https://devmind-api.aryalabs.workers.dev${url.pathname}${url.search}`;

  const response = await fetch(apiUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
