import { createRequire } from 'node:module';
import path from 'node:path';
import webpack from 'webpack';

const require = createRequire(import.meta.url);
const packageDir = process.cwd();
const pkg = require(`${packageDir}/package.json`);

const config: webpack.Configuration = {
  mode: 'development',
  devtool: 'source-map',
  entry: './src/mod.ts',
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    '@mui/material': 'MaterialUI',
    '@mui/icons-material': 'MaterialUIIcons',
  },
  optimization: {
    minimize: false,
  },
  performance: {
    hints: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            onlyCompileBundledFiles: true,
            compilerOptions: {
              sourceMap: true,
              inlineSourceMap: false,
              removeComments: false,
            },
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|gif|svg|webp)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
      {
        test: /\.(otf|ttf|woff|woff2|eot)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'mod.js',
    path: path.resolve(packageDir, `dist/${pkg.name}`),
    library: {
      name: 'AFNMMod',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
    publicPath: 'mod://',
  },
  plugins: [
    new webpack.DefinePlugin({
      MOD_METADATA: JSON.stringify({
        name: pkg.name,
        version: pkg.version,
        author: pkg.author,
        description: pkg.description,
      }),
    }),
  ],
};

export default config;
