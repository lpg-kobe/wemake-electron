/**
* @desc local dev server from webpack-dev-server
* @author pika
*/

'use strict';
const webpack = require('webpack')
const htmlWebpackPlugin = require('html-webpack-plugin')
const devServer = require('webpack-dev-server')
const { merge } = require('webpack-merge')
const { readFile2Json } = require('./tool')
const { TypedCssModulesPlugin } = require('typed-css-modules-webpack-plugin')
const { dependencies } = require('../app/package.json')
const path = require('path')

const appRoot = path.join(__dirname, '..', 'app')
const { defineKey } =
  process.env.NODE_ENV === 'production'
    ? readFile2Json(path.join(appRoot, './.env.prod'))
    : readFile2Json(path.join(appRoot, './.env.dev'))

const baseConfig = {
  externals: [ 
    ...Object.keys(dependencies || {})
  ],

  devtool: 'source-map',

  mode: 'development',

  entry: [
    // this can config only in development during electron, base in version 80 of chrome
    // 'core-js',
    // 'regenerator-runtime/runtime',
    // ...(process.env.PLAIN_HMR ? [] : ['react-hot-loader/patch']),
    // `webpack-dev-server/client?http://localhost:${port}/`,
    // 'webpack/hot/only-dev-server',
    path.join(appRoot, './index.tsx')
    // require.resolve('../app/index.tsx')
  ],

  output: {
    path: path.join(appRoot,'./dist'),
    // publicPath,
    filename: 'renderer.dev.js',
    chunkFilename: 'js/[name].render.chunk.js'
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx|tsx|ts)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      },
      {
        test: /\.global\.css$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /^((?!\.global).)*\.css$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              // modules: {
              //   localIdentName: '[name]__[local]__[hash:base64:5]'
              // },
              sourceMap: true,
              importLoaders: 1
            }
          },
          {
            loader: require.resolve('postcss-loader')
          }
        ]
      },
      // Less support - compile all .global.less files and pipe it to style.css
      {
        test: /\.global\.less$/,
        use: [
          {
            loader: require.resolve('style-loader')
          },
          {
            loader: require.resolve('css-loader'),
            options: {
              sourceMap: true,
              importLoaders: 1
            }
          },
          {
            loader: require.resolve('postcss-loader')
          },
          {
            loader: require.resolve('less-loader'),
            options: { lessOptions: { javascriptEnabled: true } }
          }
        ]
      },
      // Less support - compile all other .less files and pipe it to style.css
      {
        test: /^((?!\.global).)*\.less$/,
        use: [
          {
            loader: require.resolve('style-loader')
          },
          {
            loader: require.resolve('css-loader'),
            options: {
              // modules: {
              //   localIdentName: '[name]__[local]__[hash:base64:5]'
              // },
              sourceMap: true,
              importLoaders: 1
            }
          },
          {
            loader: require.resolve('postcss-loader')
          },
          {
            loader: require.resolve('less-loader'),
            options: { lessOptions: { javascriptEnabled: true } }
          }
        ]
      },
      // WOFF Font
      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/font-woff'
          }
        }
      },
      // WOFF2 Font
      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/font-woff'
          }
        }
      },
      // TTF Font
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/octet-stream'
          }
        }
      },
      // EOT Font
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        use: 'file-loader'
      },
      // SVG Font
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'image/svg+xml'
          }
        }
      },
      // Common Image Formats
      {
        test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/,
        use: 'url-loader'
      },
      {
        test: /\.node$/,
        use: [
          {
            loader: 'native-ext-loader',
            options: {
              emit: false,
              // tell webpack to find *.node file in directory we set
              rewritePath:
                process.env.NODE_ENV === 'production'? './' : 'node_modules/@serialport/bindings/build/Release/'
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [appRoot, 'node_modules'],
    alias: {
      '@': appRoot,
      bindings: path.resolve(__dirname, './bindings.js')
    }
  },
  plugins: [
    // requiredByDLLConfig
    //   ? null
    //   : new webpack.DllReferencePlugin({
    //       context: path.join(__dirname, '..', 'dll'),
    //       manifest: require(manifest),
    //       sourceType: 'var'
    //     }),

    // new webpack.HotModuleReplacementPlugin({
    //   multiStep: true
    // }),

    new webpack.DefinePlugin(defineKey),

    new TypedCssModulesPlugin({
      globPattern: 'app/**/*.{css,scss,sass}'
    }),

    // new webpack.NoEmitOnErrorsPlugin(),

    new htmlWebpackPlugin({
      template: path.join(appRoot, './app.html')
    }),

    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     *
     * By default, use 'development' as NODE_ENV. This can be overriden with
     * 'staging', for example, by changing the ENV variables in the npm scripts
     */
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development'
    }),

    // new webpack.LoaderOptionsPlugin({
    //   debug: true
    // })
  ]
}

const devConfig = merge(baseConfig, {
    mode: 'development',
    output: {
    },
    devtool: 'source-map',
    module: {
    },
    optimization: {
    },
    plugins: [
        
    ]
})
const compiler = webpack(devConfig)
const devOption = {
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: {
        index: 'app.html',
    },
    stats: {
        colors: true
    },
    contentBase: [path.join(__dirname, '../resources'), path.join(appRoot, './dist')],
    watchContentBase: true
}
const Server = new devServer(compiler, devOption)
Server.listen(8024, 'localhost', () => {
    console.log(`Server is listen on ${8024}`)
})