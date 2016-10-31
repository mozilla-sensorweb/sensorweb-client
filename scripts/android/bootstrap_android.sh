#!/usr/bin/env bash

set -e

echo "adding android platform"
cordova platform add android

echo "building for android"
cordova build android