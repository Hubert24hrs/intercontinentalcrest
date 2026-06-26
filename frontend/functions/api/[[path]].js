export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = 'https://intercontinentalcrest-backend.vercel.app' + url.pathname + url.search;

  const proxyRequest = new Request(targetUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: ['GET', 'HEAD'].includes(context.request.method) ? null : context.request.body,
    redirect: 'manual',
  });

  const response = await fetch(proxyRequest);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
