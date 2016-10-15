#!/usr/bin/env sh
PLIST=./platforms/ios/SensorWeb/SensorWeb-Info.plist

cat << EOF |
Remove :NSLocationWhenInUseUsageDescription
Add :NSLocationWhenInUseUsageDescription string This allows us to match your sensor’s data to its location.
EOF
while read line
do
    /usr/libexec/PlistBuddy -c "$line" $PLIST
done

true