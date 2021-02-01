/**
 * Build config for development in browser that uses
 * Hot-Module-Replacement
 *
 * https://webpack.js.org/concepts/hot-module-replacement/
 */

import path from 'path'
import fs from 'fs'
import webpack from 'webpack'
import chalk from 'chalk'
import htmlWebpackPlugin from 'html-webpack-plugin'
import { execSync } from 'child_process'
import { TypedCssModulesPlugin } from 'typed-css-modules-webpack-plugin'
import CheckNodeEnv from '../internals/scripts/CheckNodeEnv'

import { dependencies as externals } from '../app/package.json'
import { readFile2Json } from './tool'

// When an ESLint server is running, we can't set the NODE_ENV so we'll check if it's
// at the dev webpack config is not accidentally run in a production environment
if (process.env.NODE_ENV === 'production') {
  CheckNodeEnv('development')
}

const appRoot = path.join(__dirname, '..', 'app')
const { defineKey } =
  process.env.NODE_ENV === 'production'
    ? readFile2Json(path.join(appRoot, './.env.prod'))
    : readFile2Json(path.join(appRoot, './.env.dev'))
const port = process.env.PORT || 8024
const publicPath = "./"
const dll = path.join(__dirname, '..', 'dll')
const manifest = path.resolve(dll, 'renderer.json')
const requiredByDLLConfig = module.parent.filename.includes(
  'webpack.config.renderer.dev.bs.dll'
)

/**
 * Warn if the DLL is not built
 */
if (!requiredByDLLConfig && !(fs.existsSync(dll) && fs.existsSync(manifest))) {
  console.log(
    chalk.black.bgYellow.bold(
      'The DLL files are missing. Sit back while we build them for you with "yarn build-dll"'
    )
  )
  execSync('yarn build-dll')
}

export default {
  externals: [...Object.keys(externals || {})],

  devtool: 'source-map',

  mode: 'development',

  entry: [
    // this can config only in development during electron, base in version 80 of chrome
    'core-js',
    'regenerator-runtime/runtime',
    // ...(process.env.PLAIN_HMR ? [] : ['react-hot-loader/patch']),
    // `webpack-dev-server/client?http://localhost:${port}/`,
    // 'webpack/hot/only-dev-server',
    require.resolve('../app/index.tsx')
  ],

  output: {
    path: appRoot,
    publicPath,
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
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [appRoot, 'node_modules'],
    alias: {
      '@': appRoot,
      // bindings: path.resolve(__dirname, './bindings.js')
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

    new webpack.NoEmitOnErrorsPlugin(),

    new htmlWebpackPlugin({
      template: path.join(__dirname, '../app/app.html')
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
  ],

  // node: {
  //   __dirname: false,
  //   __filename: false
  // },

  devServer: {
    open: true,
    port,
    hot: true,
    compress: true,
    historyApiFallback: {
        index: 'app.html',
    },
    stats: {
        colors: true
    },
    contentBase: [path.join(__dirname, '../resources'), path.join(__dirname, '../app/dist')],
    watchContentBase: true
  }
}
