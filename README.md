# Wireless Measurement Project
This Git repository contains the source files for the Wireless Measurement Project, which implements a Medical Internet of Things (MIoT) solution for real-time health monitoring.

## APK
Expo app can be found in folder "APK".

## ESP Arduino file
Arduino code can be found in folder "ESP32/Heart_rate_Temp_Sensor_Project_working_HR".

## Expo
expo sdk 50-> jdk 17 and expo sdk 49<- jdk 13

### For build
npx expo install react-native-ble-plx

npx expo prebuild (this needs to be done always when the permissions are udpated)

npx expo install react-native-base64

npm install -g expo-cli
npm install -g eas-cli
expo login (account must be created first)

### Testing
eas build:configure
eas build --profile development --platform android

npx expo start

### Debugging
adb logcat(connect device via usb)

### Create stand alone build
eas build --profile production --platform android
