// 设置代理
const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
  app.use(
    '/graphql',
    createProxyMiddleware({
      target: 'http://slingfi.xyz',
      // target: 'http://149.104.18.64',
      changeOrigin: true,
    })
  );
};