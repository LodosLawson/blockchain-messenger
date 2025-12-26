const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    crypto: require.resolve('crypto-browserify'),
    events: require.resolve('events'),
    path: require.resolve('path-browserify'),
    process: require.resolve('process/browser'),
    vm: require.resolve('vm-browserify'),
};

module.exports = config;
