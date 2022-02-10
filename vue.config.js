const path = require('path');

function resolve(dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          modifyVars: {
            'global-theme': '~ant-design-vue/dist/antd.dark.less',
            'body-background': '#031f30',
          },
          javascriptEnabled: true,
        },
      },
    },
  },
  configureWebpack: {
    module: {
      unknownContextRegExp: /^('|')\.\/.*?\1$/,
      unknownContextCritical: false
    },
    amd: {
      toUrlUndefined: true
    },
  },

  devServer: {
    overlay: {
      warnings: true,
      errors: true
    },
    proxy: {
      '/api': {
        target: 'http://172.18.39.162:8081/',
        ws:true,
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://172.18.39.162:8081/',
        ws: true,
        changeOrigin: true
      }
    }
  }
};
