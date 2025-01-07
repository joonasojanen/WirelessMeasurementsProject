import { BleManager, Device, Characteristic, BleError } from 'react-native-ble-plx';
import { useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

const bleManager = new BleManager();

const DATA_SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const HEART_RATE_CHARACTERISTIC_UUID = "0000000a-0000-1000-8000-00805f9b34fb";

export const useBLE = () => {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);

  let monitorSubscription: (() => void) | null = null; // Store the monitoring subscription

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if (Platform.Version < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const bluetoothScanPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          {
            title: "Bluetooth Scan Permission",
            message: "Bluetooth Low Energy requires scanning for devices.",
            buttonPositive: "OK",
          }
        );
        const bluetoothConnectPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          {
            title: "Bluetooth Connect Permission",
            message: "Bluetooth Low Energy requires connecting to devices.",
            buttonPositive: "OK",
          }
        );
        return (
          bluetoothScanPermission === PermissionsAndroid.RESULTS.GRANTED &&
          bluetoothConnectPermission === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    }
    return true;
  };

  const scanForPeripherals = () => {
    if (!scanning) {
      setScanning(true);
      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.log("Error during scan:", error);
          setScanning(false);
          return;
        }

        if (
          device &&
          (device.name === "HeartRate-Sense" || device.localName === "HeartRate-Sense")
        ) {
          setAllDevices((prevDevices) => {
            if (!prevDevices.find((d) => d.id === device.id)) {
              return [...prevDevices, device];
            }
            return prevDevices;
          });
        }
      });
    }
  };

  const stopScanning = () => {
    if (scanning) {
      bleManager.stopDeviceScan();
      setScanning(false);
    } else {
      scanForPeripherals();
    }
  };

  const connectToDevice = async (device: Device) => {
    try {
      const connected = await bleManager.connectToDevice(device.id);
      setConnectedDevice(connected);
      await connected.discoverAllServicesAndCharacteristics();
      console.log("Connected to device:", connected.name);
      bleManager.stopDeviceScan();
      setScanning(false);

      startStreamingData(connected);
    } catch (error) {
      console.log("Failed to connect:", error);
    }
  };

  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      try {
        // Unsubscribe from monitoring
        if (monitorSubscription) {
          monitorSubscription();
          monitorSubscription = null;
        }

        await bleManager.cancelDeviceConnection(connectedDevice.id);
        setConnectedDevice(null);
        setHeartRate(null);
        console.log("Disconnected from device");
      } catch (error) {
        console.log("Error while disconnecting:", error);
      }
    }
  };

  const onDataUpdate = (
    error: BleError | null,
    characteristic: Characteristic | null
  ) => {
    if (error) {
      if (error.errorCode === 201) {
        // Ignore "Device disconnected" errors
        console.log("Device disconnected gracefully");
        return;
      }
      console.error("Data update error:", error);
      return;
    }

    if (!characteristic?.value) {
      console.log("No data received");
      return;
    }

    try {
      const rawBytes = Uint8Array.from(atob(characteristic.value), (c) => c.charCodeAt(0));
      const buffer = new DataView(rawBytes.buffer);
      const bpm = buffer.getFloat32(0, true);

      if (!isNaN(bpm)) {
        const roundedBpm = Math.round(bpm);
        console.log("Heart Rate (BPM):", roundedBpm);
        setHeartRate(roundedBpm);
      } else {
        console.log("Invalid heart rate data:", rawBytes);
      }
    } catch (error) {
      console.error("Error decoding heart rate data:", error);
    }
  };

  const startStreamingData = (device: Device) => {
    monitorSubscription = device.monitorCharacteristicForService(
      DATA_SERVICE_UUID,
      HEART_RATE_CHARACTERISTIC_UUID,
      onDataUpdate
    );
  };

  return {
    allDevices,
    connectedDevice,
    heartRate,
    scanning,
    scanForPeripherals,
    connectToDevice,
    disconnectFromDevice,
    requestPermissions,
    stopScanning,
  };
};
