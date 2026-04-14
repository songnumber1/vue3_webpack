export function applyWebInterceptors(client) {
  client.interceptors.request.use(function (request) {
    request.headers['X-Channel'] = 'web';
    return request;
  });
}
