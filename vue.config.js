const path = require('path');

function resolve(dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  pluginOptions: {
    "style-resources-loader": {
      preProcessor: "less",
      patterns: [
        // 存放less变量文件的路径
        path.resolve(__dirname, "./src/*.vue"),
        path.resolve(__dirname, "./src/App.vue")
      ]
    }
  },
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          modifyVars: {
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
        target: 'http://172.19.172.170:8081/',
        ws: true,
        changeOrigin: true
      },
    }
  }
};
