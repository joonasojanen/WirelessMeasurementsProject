#include <ArduinoBLE.h>

// Define BLE UUIDs
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"  // Custom Service UUID
#define HEAR_RATE_DATA_CHAR_UUID "0000000a-0000-1000-8000-00805f9b34fb"  // Heart Rate Characteristic UUID

BLEService heartRateService(SERVICE_UUID);
BLEFloatCharacteristic heartRateDataCharacteristic(HEAR_RATE_DATA_CHAR_UUID, BLERead | BLENotify);

int PulseSensorPurplePin = 34;
int LED13 = 2;

int Signal;
int Threshold = 515;
float BPM = 0;

unsigned long previousMillisGetHR = 0;  // Time of last heart rate read
unsigned long previousBeatMillis = 0;   // Time of last detected beat
unsigned long lastBeatPrintMillis = 0;  // Track the last time beat was logged
const unsigned long beatInterval = 1000; // Minimum interval between beat logs in milliseconds
const long intervalHR = 10000;          // 10 seconds interval for BPM calculation

boolean pulseDetected = false;          // Flag to detect the heartbeat
BLEDevice centralDevice;                // Track connected central device

void setup() {
  Serial.begin(9600);
  delay(2000);
  
  analogReadResolution(10);

  // Start BLE
  if (!BLE.begin()) {
    Serial.println("Starting BLE failed!");
    while (1);
  }

  BLE.setLocalName("HeartRate-Sense");
  BLE.setAdvertisedService(heartRateService);

  // Add characteristic to the service
  heartRateService.addCharacteristic(heartRateDataCharacteristic);

  // Add service
  BLE.addService(heartRateService);

  // Start advertising
  BLE.advertise();
  Serial.println("BLE device is ready to be connected");

  pinMode(LED13, OUTPUT);
}

void loop() {
  // BLE poll
  BLE.poll();

  // Check if a central device is connected
  BLEDevice central = BLE.central();

  // If a central device is connected
  if (central && !centralDevice) {
    // New connection established
    centralDevice = central;
    Serial.print("Connected to central device: ");
    Serial.println(centralDevice.address());
  } else if (!central && centralDevice) {
    // Central device disconnected
    Serial.print("Disconnected from central device: ");
    Serial.println(centralDevice.address());
    centralDevice = BLEDevice();  // Reset the central device
  }

  Signal = analogRead(PulseSensorPurplePin);
  // check the threshold
  // Serial.println(Signal);

  unsigned long currentMillis = millis();

  // Check if a beat is detected
  if (Signal > Threshold && pulseDetected == false) {
    digitalWrite(LED13, HIGH);
    pulseDetected = true;

    unsigned long timeSinceLastBeat = currentMillis - previousBeatMillis;
    previousBeatMillis = currentMillis;

    if (timeSinceLastBeat > 0) {
      BPM = 60000.0 / timeSinceLastBeat;  // Calculate BPM
    }

    // Log BPM only if at least 1 second has passed
    if (currentMillis - lastBeatPrintMillis >= beatInterval) {
      lastBeatPrintMillis = currentMillis;
      Serial.print("BPM: ");
      Serial.println(BPM);
    }
  }

  if (Signal < Threshold) {
    digitalWrite(LED13, LOW);
    pulseDetected = false;
  }

  // Update BLE characteristic every 10 seconds
  if (currentMillis - previousMillisGetHR >= intervalHR) {
    previousMillisGetHR = currentMillis;

    // Set value and notify
    heartRateDataCharacteristic.writeValue(BPM);
    Serial.print("Average BPM: ");
    Serial.println(BPM);
  }
  
  delay(20);
}
