module.exports = {
  lintOnSave: true,
  configureWebpack: {
    module: {
      unknownContextRegExp: /^('|')\.\/.*?\1$/,
      unknownContextCritical: false
    },
    amd: {
      toUrlUndefined: true
    }
  },
};
