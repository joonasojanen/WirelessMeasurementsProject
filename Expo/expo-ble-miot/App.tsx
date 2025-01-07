import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useBLE } from './useBLE';

export default function App() {
  const {
    allDevices,
    connectedDevice,
    heartRate,
    scanning,
    scanForPeripherals,
    connectToDevice,
    disconnectFromDevice,
    requestPermissions,
    stopScanning,
  } = useBLE();

  useEffect(() => {
    const initializeBLE = async () => {
      const isPermissionsGranted = await requestPermissions();
      if (isPermissionsGranted) {
        scanForPeripherals();
      }
    };
    initializeBLE();

    return () => stopScanning();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>BLE Heart Rate Monitor</Text>
      <StatusBar style="auto" />

      {!connectedDevice ? (
        <>
          <Text style={styles.subHeader}>
            {scanning ? "Scanning for devices..." : "Scan paused"}
          </Text>
          <FlatList
            data={allDevices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.deviceItem}
                onPress={() => connectToDevice(item)}
              >
                <Text>{item.name || "Unknown Device"}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        <View style={styles.connectedContainer}>
          <Text style={styles.connectedText}>
            Connected to: {connectedDevice.name || "Unknown Device"}
          </Text>
          <Text style={styles.heartRateText}>
            Heart Rate: {heartRate !== null ? `${heartRate} BPM` : "Loading..."}
          </Text>
        </View>
      )}

      {/* Button stays in the same spot */}
      <View style={styles.buttonContainer}>
        {!connectedDevice ? (
          <Button
            title={scanning ? "Stop Scanning" : "Start Scanning"}
            onPress={stopScanning}
          />
        ) : (
          <Button title="Disconnect" onPress={disconnectFromDevice} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 16,
    marginBottom: 10,
  },
  deviceItem: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  connectedContainer: {
    alignItems: 'center',
    marginBottom: 20, // Adds space above the button
  },
  connectedText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  heartRateText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'red',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50, // Ensures the button is always at the same position from the bottom
    alignSelf: 'center',
    width: '80%', // Keeps a consistent button width
  },
});
