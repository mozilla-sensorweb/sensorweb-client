# Sensorweb Client

> Cordova based app

## Setup

Node should be installed
Install cordova: sudo npm install -g cordova
Install dependencies: npm install

## Running on iOS

Add the platform: cordova platform add ios
Run: cordova build ios

Install the app with xCode

## Running on Android

Add the platform: cordova platform add android
Run: cordova build android
Build generated in: ~/platforms/android/build/outputs/apk
Run: adb install android-debug.apk