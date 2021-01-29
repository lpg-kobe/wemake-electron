/**
 * Base webpack config used across other specific configs
 */

import path from 'path'
import webpack from 'webpack'
import { dependencies as externals } from '../app/package.json'
import { readFile2Json } from './tool'

const appRoot = path.join(__dirname, '..', 'app')
const { defineKey } =
  process.env.NODE_ENV === 'production'
    ? readFile2Json(path.join(appRoot, './.env.prod'))
    : readFile2Json(path.join(appRoot, './.env.dev'))
const keys = ['env']
const nodeProcess = {}
Object.entries(process).forEach(([key, value]) => {})

export default {
  externals: [...Object.keys(externals || {})],
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
        test: /\.node$/,
        use: [
          {
            loader: 'native-ext-loader',
            options: {
              emit: false,
              // tell electron to find *.node file in directory we set
              rewritePath:
                process.env.NODE_ENV === 'production'
                  ? './resources'
                  : 'node_modules/@serialport/bindings/build/Release/'
            }
          }
        ]
      }
    ]
  },

  output: {
    path: appRoot,
    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2'
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [appRoot, 'node_modules'],
    alias: {
      '@': appRoot,
      bindings: path.resolve(__dirname, './bindings.js')
    }
  },

  plugins: [
    // 没有副作用的未使用的包不会被打包
    new webpack.LoaderOptionsPlugin({
      options: {
        sideEffects: false
      }
    }),

    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production'
    }),

    new webpack.DefinePlugin(defineKey),

    new webpack.NamedModulesPlugin()
  ]
}
