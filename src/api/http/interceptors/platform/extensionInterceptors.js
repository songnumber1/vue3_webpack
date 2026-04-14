export function applyExtensionInterceptors(client) {
  client.interceptors.request.use(function (request) {
    request.headers['X-Channel'] = 'extension';
    return request;
  });
}
