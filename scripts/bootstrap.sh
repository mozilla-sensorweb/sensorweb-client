#!/usr/bin/env bash
set -e

# Install cordova
npm install -g cordova

# Install project
npm install

npm run build

export PATH=$PATH:./node_modules/.bin

if [[ "$BUILD_TYPE" == "android" ]];then
    echo "Bootstrapping for android"
    source ./build-scripts/android/bootstrap.sh
elif [[ "$BUILD_TYPE" == "ios" ]]; then
    echo "Bootstrapping for ios"
else
    echo "Unknown build type"
fi