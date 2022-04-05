const { createProxyMiddleware } = require('http-proxy-middleware');
const visualTestApp = require('visual-test-api');

function VisualTestMiddlewareFactory(config) {
  const visualTestPort = config.visualTestPort || 3111;
  visualTestApp.listen(visualTestPort, () => {
    console.log(`visual test app listening on port ${visualTestPort}`);
  });

  // 把 jasmine 测试中发的请求代理到 VisualTestApp 服务处理
  const proxy = createProxyMiddleware({
    target: `http://127.0.0.1:${visualTestPort}`,
    changeOrigin: true,
    pathRewrite: {
      '^/visual-test': '/', // rewrite path
    },
  });

  return (req, response, next) => {
    // 请求 VisualTestApp 服务
    if (req.originalUrl.startsWith('/visual-test')) {
      // 如果是 get 请求就直接 302 过去
      if (req.method === 'GET') {
        response.writeHead(302, {
          Location: `http://127.0.0.1:${visualTestPort}${req.originalUrl.replace(/^\/visual-test/g, '')}`,
        });
        response.end();
        return;
      } else {
        proxy(req, response, next);
        return;
      }
    }
    next();
  };
}

module.exports = {
  'middleware:visual-test': ['factory', VisualTestMiddlewareFactory],
};
