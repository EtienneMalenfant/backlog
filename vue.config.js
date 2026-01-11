module.exports = {
  lintOnSave: false, // Disable ESLint temporarily to avoid config errors
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
  configureWebpack: (config) => {
    if (process.env.WEBPACK_TARGET === 'electron-renderer') {
      config.target = 'electron-renderer';
      config.externals = {
        electron: 'electron'
      };
    }
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      mainProcessFile: 'src/background.js',
      mainProcessWatch: ['src'],
      externals: ['electron', 'electron-context-menu', 'lowdb', 'events', 'fs', 'stream', 'util', 'assert', 'constants', 'path'],
      builderOptions: {
        linux: {
          icon: 'logo.png'
        }
      }
    }
  }
};
