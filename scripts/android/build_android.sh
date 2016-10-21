#!/usr/bin/env bash

set -e

cordova platform add android

cordova build android

cd platforms/android

# check our app source code
./gradlew app:check

# exclude lint task as already done above
./gradlew build -x lint --info --console plain | tee

cd -
