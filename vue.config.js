module.exports = {
  css: {
    loaderOptions: {
      css: {
        // options here will be passed to css-loader
      },
      less: {
        javascriptEnabled: true
      }
    }
  },
  configureWebpack: {
    externals: {
      events: 'commonjs events'
    }
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true
    }
  }
};
