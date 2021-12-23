const path = require('path');

function resolve(dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  lintOnSave: true,
  configureWebpack: {
    module: {
      unknownContextRegExp: /^('|')\.\/.*?\1$/,
      unknownContextCritical: false
    },
    amd: {
      toUrlUndefined: true
    },
    // resolve: {
    //   alias: {
    //     '@': resolve('src')
    //   }
    // }
  },
  devServer: {
    overlay: {
      warnings: true,
      errors: true
    },
    proxy: {
      '/v1': {
        target: 'http://localhost:8081/',
        ws: true,
        changeOrigin: true
      },
    }
  }
};
