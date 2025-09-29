const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
        entry: './index.tsx',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].[contenthash].js',
            publicPath: '/', // Use '/' for robust SPA routing
            clean: true,
            // To support d3-force in the worker
            globalObject: 'this',
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            fallback: {
                // Polyfill for 'process' which is used by some dependencies like 'canvg'.
                process: require.resolve('process/browser'),
                // Needed by dependencies of epub-constructor.
                path: require.resolve('path-browserify'),
                // A common Node.js utility library, often a dependency of other polyfills.
                util: require.resolve('util/'),
                // Needed by jszip and epub-constructor dependencies for handling data streams.
                stream: require.resolve('stream-browserify'),
                // Needed by jszip for compression.
                zlib: require.resolve('browserify-zlib'),
                // Needed by jszip and other libraries for binary data handling.
                buffer: require.resolve('buffer/'),
                // Needed by html-to-docx, but can be disabled.
                crypto: false,
                // Stubbed out as filesystem access is not possible/needed in the browser.
                fs: false,
                // A dependency that is not used, can be safely stubbed.
                encoding: false,
                // Needed by epub-constructor.
                assert: require.resolve('assert/'),
                // Polyfills for Node.js core modules required by dependencies.
                url: require.resolve('url/'),
                http: require.resolve('stream-http'),
                https: require.resolve('https-browserify'),
            },
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: 'ts-loader',
                    },
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader', 'postcss-loader'],
                },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: 'index.html',
            }),
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
                process: 'process/browser.js',
            }),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(argv.mode || 'development'),
            }),
            new CopyWebpackPlugin({
                patterns: [
                    { from: 'manifest.json', to: 'manifest.json' },
                    { from: 'assets', to: 'assets' },
                ],
            }),
            // Conditionally add the GenerateSW plugin only for production builds
            ...(isProduction
                ? [
                      new GenerateSW({
                          clientsClaim: true,
                          skipWaiting: true,
                          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
                          runtimeCaching: [
                            {
                              urlPattern: /^https:\/\/aistudiocdn\.com\/.*/,
                              handler: 'StaleWhileRevalidate',
                              options: {
                                cacheName: 'aistudio-cdn-cache',
                                expiration: {
                                  maxEntries: 50,
                                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                                },
                              },
                            },
                          ],
                      }),
                  ]
                : []),
        ],
        devServer: {
            static: {
                directory: path.join(__dirname, 'dist'),
            },
            compress: true,
            port: 9000,
            hot: true,
            historyApiFallback: true,
        },
    };
};