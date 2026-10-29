module.exports = {
  '/api-casilda': {
    target: 'https://casildaqa.duckdns.org',
    secure: false,
    changeOrigin: true,
    onProxyReq: function (proxyReq) {
      proxyReq.removeHeader('origin');
      proxyReq.removeHeader('referer');
    },
    configure: function (proxy) {
      proxy.on('proxyReq', function (proxyReq) {
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
      });
    }
  },
  '/contenidos/imagenes': {
    target: 'https://casildaqa.duckdns.org/api-casilda',
    secure: false,
    changeOrigin: true,
    onProxyReq: function (proxyReq) {
      proxyReq.removeHeader('origin');
      proxyReq.removeHeader('referer');
    },
    configure: function (proxy) {
      proxy.on('proxyReq', function (proxyReq) {
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
      });
    }
  }
};
