#!/usr/bin/env bash

set -e

cd platforms/android

# exclude lint task 
./gradlew build -x lint --info --console plain | tee

cd -
