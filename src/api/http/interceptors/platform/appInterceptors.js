export function applyAppInterceptors(client) {
  client.interceptors.request.use(function (request) {
    request.headers['X-Channel'] = 'app';
    request.headers['X-App-Bridge-Ready'] = 'true';
    return request;
  });
}
