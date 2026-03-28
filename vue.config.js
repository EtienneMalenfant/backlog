module.exports = {
  css: {
    loaderOptions: {
      css: {
        // options here will be passed to css-loader
      },
      less: {
        lessOptions: {
          javascriptEnabled: true
        }
      }
    }
  },
  configureWebpack: {
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: false,
      preload: 'src/preload.js'
    }
  }
};
