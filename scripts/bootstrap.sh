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
    source ./scripts/android/bootstrap_android.sh
elif [[ "$BUILD_TYPE" == "ios" ]]; then
    echo "TODO: Bootstrapping for ios"
else
    echo "Unknown build type"
fi
