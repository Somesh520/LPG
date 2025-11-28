# 🔥 Smart Gas Guardian (IoT LPG Monitor)

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-IoT%20|%20React%20Native%20|%20Firebase-blue)
![Hardware](https://img.shields.io/badge/Hardware-ESP32%20|%20HX711%20|%20MQ--6-orange)

## 📖 Overview

**Smart Gas Guardian** is a comprehensive IoT solution designed to monitor domestic LPG cylinders. It provides real-time tracking of gas levels (weight), detects gas leakages for safety, and offers remote monitoring via a dedicated mobile application.

The system intelligently calculates the remaining gas by subtracting the cylinder's empty weight (Tare Weight) from the total weight measured by load cells.

## ✨ Key Features

* **⚖️ Real-Time Weight Monitoring:** Precise measurement of gas availability using HX711 Load Cells.
* **⚠️ Gas Leakage Detection:** Instant alerts using the MQ-6 Gas Sensor to detect propane/butane leaks.
* **🔒 Auto-Shutoff Mechanism:** Automatically turns off the gas regulator using a Servo Motor if a leak is detected.
* **📱 Mobile App Integration:** A cross-platform React Native app to view live data anywhere.
* **☁️ Cloud Sync:** Real-time data synchronization using Google Firebase.
* **📊 Usage Analytics:** (Future Scope) Predicts when the gas will run out based on daily usage patterns.

## 🛠️ Tech Stack

### Hardware
* **Microcontroller:** ESP32 (Wi-Fi enabled)
* **Weight Sensor:** Load Cell (40kg/50kg) + HX711 Amplifier Module
* **Gas Sensor:** MQ-6 (Specific for LPG/Butane/Propane)
* **Actuator:** MG995 / SG90 Servo Motor (for valve control)
* **Power Supply:** 5V DC

### Software & Cloud
* **Mobile App:** React Native (CLI/Expo)
* **Backend/Database:** Google Firebase (Realtime Database / Firestore)
* **Firmware:** C++ (Arduino IDE)
* **Protocol:** HTTP / WebSocket

## 📐 Logic & Calculation

To determine the actual gas content, the system uses the following logic:

$$\text{LPG Weight} = \text{Total Weight (Sensor)} - \text{Tare Weight (Cylinder)}$$

* **Total Weight:** Raw data from the HX711 load cell.
* **Tare Weight:** The weight of the empty metal cylinder (manually calibrated/input via app).

## 🚀 Installation & Setup

### 1. Hardware Setup
1.  Connect the **HX711** to the ESP32 (DT and SCK pins).
2.  Connect the **MQ-6** sensor to an Analog pin (AO).
3.  Connect the **Servo Motor** to a PWM-enabled digital pin.
4.  Power the ESP32 via USB or external 5V source.

### 2. Firmware (ESP32)
1.  Open `SmartGasFirmware.ino` in Arduino IDE.
2.  Install required libraries: `HX711`, `FirebaseESP32`, `Servo`.
3.  Update Wi-Fi credentials and Firebase API keys in the code.
4.  Upload the code to the ESP32.

### 3. Mobile App (React Native)
```bash
# Clone the repository
git clone [https://github.com/your-username/smart-gas-guardian.git](https://github.com/your-username/smart-gas-guardian.git)

# Navigate to app directory
cd mobile-app

# Install dependencies
npm install

# Run on Android
npx react-native run-android
