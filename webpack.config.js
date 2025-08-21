const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: './src/index.js',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'index.js',
            library: {
                name: 'NativeScrollSlider',
                type: 'umd',
                export: 'default'
            },
            globalObject: 'this',
            clean: true
        },
        module: {
            rules: [
                {
                    test: /\.(js|ts)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/preset-env', {
                                    modules: false,
                                    targets: {
                                        browsers: ['> 1%', 'last 2 versions', 'not ie <= 8']
                                    }
                                }]
                            ]
                        }
                    }
                }
            ]
        },
        resolve: {
            extensions: ['.js', '.ts']
        },
        optimization: {
            minimize: isProduction,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: isProduction,
                        },
                        format: {
                            comments: false,
                        },
                    },
                    extractComments: false,
                }),
            ],
        },
        target: 'web',
        mode: isProduction ? 'production' : 'development',
        devtool: isProduction ? 'source-map' : 'eval-source-map',
    };
};
