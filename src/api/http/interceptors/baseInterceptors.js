export function applyBaseInterceptors(client, config) {
  client.interceptors.request.use(function (request) {
    request.headers['X-Platform'] = config.platform;
    request.headers['X-Api-Version'] = config.apiVersion;
    request.headers['X-Customer'] = config.customer;
    return request;
  });

  client.interceptors.response.use(
    function (response) {
      return response;
    },
    function (error) {
      console.error('[HTTP ERROR]', error && error.message ? error.message : error);
      return Promise.reject(error);
    }
  );
}
