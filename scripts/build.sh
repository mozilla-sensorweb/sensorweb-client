#!/usr/bin/env bash
set -e
set -o pipefail

if [[ "$BUILD_TYPE" == "android" ]];then
    echo "Building for android"
    source ./scripts/android/build_android.sh
elif [[ "$BUILD_TYPE" == "ios" ]]; then
    echo "Building for ios"
    cd ios
    echo "TODO"
    cd -
else
    echo "Unknown build type"
fi