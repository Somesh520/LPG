// ===========================================
// ======== AAPKA UPDATED HomeScreen.tsx ========
// ===========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
  Dimensions,
  StatusBar
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import LinearGradient from 'react-native-linear-gradient';
import { Svg, Circle } from 'react-native-svg';

// ---------- CONSTANTS ----------
const LOW_GAS_THRESHOLD_KG = 2.0;
const GAS_PROVIDER_URL = 'https://portal.indianoil.in/sbw/Mobile/LPG/';
const ONLINE_THRESHOLD_SECONDS = 30;
const MAX_WEIGHT = 14.2;
const GAUGE_SIZE = 220;
const STROKE_WIDTH = 22;
const GAUGE_RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const GAUGE_CIRCUMFERENCE = GAUGE_RADIUS * 2 * Math.PI;

const screenWidth = Dimensions.get('window').width - 40;

export default function HomeScreen({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<any>(null);
  const [gasHistory, setGasHistory] = useState<number[]>([]);
  const [weightHistory, setWeightHistory] = useState<number[]>([]); // ⭐️ YEH ADD HUA HAI
  const [now, setNow] = useState(new Date());
  const user = auth().currentUser;

  // ---------- Booking ----------
  const handleBookCylinder = () => {
    navigation.navigate('Booking'); 
  };

  // ---------- Add Device ----------
  const handleAddDevice = () => {
    navigation.navigate('AddDevice');
  };

  // ---------- Servo Command ----------
  const sendServoCommand = async (command: 'OPEN' | 'CLOSED') => {
    if (!device || !device.id) {
      Alert.alert('Error', 'Device not found. Cannot send command.');
      return;
    }
    
    console.log(`Sending command: ${command} to device: ${device.id}`);
    try {
      await firestore().collection('devices').doc(device.id).update({
        servoCommand: command,
      });
      Alert.alert('Success', `Regulator ${command} command sent!`);
    } catch (err: any) {
      console.error("Command Error:", err);
      Alert.alert('Error', 'Failed to send command.');
    }
  };

  // ---------- Load Stored Graph Data on Start (Updated) ----------
  useEffect(() => {
    const loadStoredHistory = async () => {
      try {
        // 1. Gas History
        const stored = await AsyncStorage.getItem('gasHistory');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGasHistory(parsed);
          } else {
            setGasHistory([]);
          }
        } else {
          setGasHistory([]);
        }

        // 2. Weight History (⭐️ YEH ADD HUA HAI)
        const storedWeight = await AsyncStorage.getItem('weightHistory');
        if (storedWeight) {
          const parsedWeight = JSON.parse(storedWeight);
          if (Array.isArray(parsedWeight) && parsedWeight.length > 0) {
            setWeightHistory(parsedWeight);
          } else {
            setWeightHistory([]);
          }
        } else {
          setWeightHistory([]);
        }

      } catch (err) {
        console.log('⚠️ Error loading stored history:', err);
      }
    };
    loadStoredHistory();
  }, []);

  // ---------- Firestore Listener (Updated) ----------
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 5000);

    if (!user) {
      clearInterval(timer);
      return;
    }

    const unsubscribe = firestore()
      .collection('devices')
      .where('ownerId', '==', user.uid)
      .onSnapshot(
        snapshot => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data();

            const lastUpdated = data?.lastUpdated?.toDate?.() ?? null;
            const gasValue = parseFloat(data?.gasLevel ?? 0);
            const weightValue = parseFloat(data?.weight ?? 0); // ⭐️ YEH ADD HUA HAI

            setDevice({
              id: doc.id,
              name: data?.name || 'Unnamed Device',
              ownerName: data?.ownerName || user.displayName || 'User',
              gasLevel: gasValue,
              weight: weightValue, // Use variable
              unit: data?.unit || 'kg',
              lastUpdated,
              servoStatus: data?.servoCommand || 'OPEN',
              alert: data?.alert || false,
            });

            // --- Update Gas Graph (Existing) ---
            setGasHistory(prev => {
              if (gasValue > 0) {
                const updated = [...prev, gasValue];
                const limited = updated.length > 10 ? updated.slice(updated.length - 10) : updated;
                AsyncStorage.setItem('gasHistory', JSON.stringify(limited));
                return limited;
              }
              return prev;
            });

            // --- Update Weight Graph (⭐️ YEH ADD HUA HAI) ---
            setWeightHistory(prev => {
              if (weightValue > 0) {
                // Only add if value changed (optional, good for storage)
                if (prev.length === 0 || prev[prev.length - 1] !== weightValue) {
                  const updated = [...prev, weightValue];
                  const limited = updated.length > 10 ? updated.slice(updated.length - 10) : updated;
                  // Save to local storage for the graph screen
                  AsyncStorage.setItem('weightHistory', JSON.stringify(limited));
                  return limited;
                }
              }
              return prev; // Return old state if 0 or same
            });

          } else {
            setDevice(null);
          }
          setLoading(false);
        },
        err => {
          console.error('❌ Firestore error:', err);
          Alert.alert('Error', 'Could not load device data.');
          setLoading(false);
        },
      );

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [user]);

  // --- Status Calculation ---
  const isOnline = device?.lastUpdated
    ? (now.getTime() - device.lastUpdated.getTime()) / 1000 < ONLINE_THRESHOLD_SECONDS
    : false;
  const isLowGas = device?.weight <= LOW_GAS_THRESHOLD_KG && device?.weight > 0;
  const isLeak = device?.alert === true; // Using alert field

  // --- Gauge Progress Calculation ---
  const weightPercentage = Math.min(Math.max(device?.weight / MAX_WEIGHT, 0), 1);
  const strokeDashoffset = GAUGE_CIRCUMFERENCE * (1 - weightPercentage);
  const gaugeColor = isLowGas ? '#FFA000' : (weightPercentage > 0.5 ? '#4CAF50' : '#007AFF');

  // ---------- UI (No changes needed) ----------
  // ... (Baaki saara UI code neeche same rahega) ...

  // 🎨 1. Loading Screen
  if (loading) {
    return (
      <LinearGradient colors={['#000428', '#004e92']} style={styles.center}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ marginTop: 10, color: '#ccc' }}>Loading dashboard...</Text>
      </LinearGradient>
    );
  }

  // 🎨 2. No Device Screen
  if (!device) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient colors={['#000428', '#004e92']} style={styles.center}>
          <StatusBar barStyle="light-content" />
          <Icon name="gas-cylinder-outline" size={70} color="#FFFFFF" />
          <Text style={styles.empty}>No device linked yet</Text>
          <Text style={styles.emptySubtitle}>Let's add your Smart Guardian</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddDevice}>
            <Icon name="plus" size={20} color="#004e92" />
            <Text style={styles.addBtnText}>Add New Device</Text>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // 🎨 3. Main Dashboard
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000428', '#004e92']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.deviceName}>{device.name}</Text>
          <View style={[styles.statusBadge, isOnline ? styles.online : styles.offline]}>
            <Icon name={isOnline ? 'wifi' : 'wifi-off'} size={16} color="#fff" />
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
        <Text style={styles.ownerText}>👤 {device.ownerName}</Text>
        
        {/* SVG Weight Gauge */}
        <View style={styles.gaugeContainer}>
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}>
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={GAUGE_RADIUS}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={GAUGE_RADIUS}
              stroke={gaugeColor}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={GAUGE_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${GAUGE_SIZE / 2} ${GAUGE_SIZE / 2})`}
            />
          </Svg>
          <View style={styles.gaugeTextContainer}>
            <Text style={styles.gaugeValue}>{device.weight ? `${device.weight.toFixed(2)}` : 'N/A'}</Text>
            <Text style={styles.gaugeUnit}>{device.unit}</Text>
            <Text style={styles.gaugeLabel}>Weight</Text>
          </View>
        </View>

        {/* Alerts */}
        {isLeak && (
          <View style={[styles.alertBox, styles.leakCard]}>
            <Icon name="fire-alert" size={24} color="#B71C1C" />
            <View style={styles.alertTextBox}>
              <Text style={[styles.alertTitle, { color: '#B71C1C' }]}>GAS LEAK DETECTED!</Text>
              <Text style={[styles.alertText, { color: '#B71C1C' }]}>
                Turn off main valve immediately and ventilate the area!
              </Text>
            </View>
          </View>
        )}
        {isLowGas && !isLeak && (
          <View style={[styles.alertBox, styles.warningCard]}>
            <Icon name="alert-outline" size={24} color="#E65100" />
            <View style={styles.alertTextBox}>
              <Text style={[styles.alertTitle, { color: '#E65100' }]}>Low Gas Warning</Text>
              <Text style={[styles.alertText, { color: '#E65100' }]}>
                Gas is below {LOW_GAS_THRESHOLD_KG} KG. Please book a new cylinder.
              </Text>
            </View>
          </View>
        )}
        
        {/* Servo Controls */}
        <View style={styles.controlGroup}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.controlButtonOn,
              device.servoStatus === 'OPEN' && !isLeak && styles.controlButtonActive
            ]}
            onPress={() => sendServoCommand('OPEN')}
            disabled={isLeak}
          >
            <Icon name="valve-open" size={20} color={device.servoStatus === 'OPEN' && !isLeak ? '#000428' : '#fff'} />
            <Text style={[styles.controlButtonText, device.servoStatus === 'OPEN' && !isLeak && styles.controlButtonActiveText]}>
              Manual ON
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.controlButtonOff,
              (device.servoStatus === 'CLOSED' || isLeak) && styles.controlButtonActive
            ]}
            onPress={() => sendServoCommand('CLOSED')}
          >
            <Icon name="valve-closed" size={20} color={(device.servoStatus === 'CLOSED' || isLeak) ? '#000428' : '#fff'} />
            <Text style={[styles.controlButtonText, (device.servoStatus === 'CLOSED' || isLeak) && styles.controlButtonActiveText]}>
              Manual OFF
            </Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Cards */}
        <View style={styles.cardsRow}>
          <View style={[styles.card, isLeak && styles.leakCard]}>
            <Icon name="fire" size={30} color={isLeak ? '#E53935' : '#009688'} />
            <Text style={styles.cardLabel}>Gas Level (Leak Sensor)</Text>
            <Text style={[styles.cardValue, isLeak && { color: '#B71C1C' }]}>
              {device.gasLevel ? `${device.gasLevel.toFixed(0)}%` : 'N/A'}
            </Text>
          </View>

          <View style={styles.card}>
            <Icon name="clock-outline" size={30} color="#007AFF" />
            <Text style={styles.cardLabel}>Last Updated</Text>
            <Text style={[styles.cardValue, { fontSize: 16 }]}>
              {device.lastUpdated ? device.lastUpdated.toLocaleTimeString() : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Gas Level Graph */}
        <View style={styles.graphContainer}>
          <Text style={styles.graphTitle}>Gas Sensor Trend (PPM)</Text>
          {gasHistory.length > 1 ? (
            <LineChart
              data={{
                labels: [],
                datasets: [{ data: gasHistory, strokeWidth: 3 }],
              }}
              width={screenWidth}
              height={220}
              withShadow={true}
              withHorizontalLines={false}
              withVerticalLines={false}
              chartConfig={{
                backgroundGradientFrom: 'rgba(255, 255, 255, 0.05)',
                backgroundGradientTo: 'rgba(255, 255, 255, 0.05)',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 150, 136, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#009688' },
                propsForBackgroundLines: { stroke: 'transparent' }
              }}
              bezier
              style={{ borderRadius: 16, paddingRight: 0 }}
            />
          ) : (
            <View style={styles.emptyGraph}>
              <Icon name="chart-line-variant" size={40} color="#888" />
              <Text style={styles.emptyGraphText}>
                Waiting for gas sensor data...
              </Text>
              <Text style={styles.emptyGraphSubText}>
                Data will appear here as the sensor warms up and sends readings.
              </Text>
            </View> 
          )}
        </View>

        {/* Footer Button */}
        {isLowGas && (
          <TouchableOpacity style={styles.bookBtn} onPress={handleBookCylinder}>
            <Icon name="phone" size={20} color="#004e92" />
            <Text style={styles.bookBtnText}>Book New Cylinder</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- STYLES (Aapke original styles) ----------
const styles = StyleSheet.create({
  // Containers
  container: { flex: 1, backgroundColor: '#000428' },
  scroll: { padding: 20, paddingBottom: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  // Empty State
  empty: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginTop: 15 },
  emptySubtitle: { fontSize: 16, color: '#ccc', marginTop: 5 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginTop: 25,
  },
  addBtnText: { color: '#004e92', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 5 },
  deviceName: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  ownerText: { fontSize: 16, color: '#aaa', marginBottom: 25, width: '100%' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  online: { backgroundColor: '#4CAF50' },
  offline: { backgroundColor: '#E53935' },
  statusText: { color: '#fff', marginLeft: 5, fontWeight: '600', fontSize: 14 },

  // Gauge
  gaugeContainer: { width: GAUGE_SIZE, height: GAUGE_SIZE, alignItems: 'center', justifyContent: 'center', marginBottom: 30, alignSelf: 'center' },
  gaugeTextContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  gaugeValue: { fontSize: 48, fontWeight: '800', color: '#FFFFFF' },
  gaugeUnit: { fontSize: 20, color: '#FFFFFF', fontWeight: '500', marginTop: -5 },
  gaugeLabel: { fontSize: 16, color: '#aaa', marginTop: 5 },

  // Cards
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    minHeight: 120,
    justifyContent: 'center',
  },
  cardLabel: { fontSize: 15, color: '#aaa', marginTop: 8, textAlign: 'center' },
  cardValue: { fontSize: 22, fontWeight: 'bold', marginTop: 4, color: '#FFFFFF' },

  // Graph
  graphContainer: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  graphTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 15, alignSelf: 'flex-start' },
  emptyGraph: { 
    height: 220, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20,
  },
  emptyGraphText: { 
    color: '#aaa', 
    marginTop: 10, 
    fontSize: 16,
    fontWeight: '600'
  },
  emptyGraphSubText: {
    color: '#888',
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
  },

  // Alerts
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 15,
    marginTop: 5,
    marginBottom: 20,
    borderWidth: 1,
  },
  alertTextBox: { flex: 1, marginLeft: 12 },
  alertTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  alertText: { fontSize: 14, lineHeight: 20 },
  warningCard: { backgroundColor: '#FFF8E1', borderColor: '#FFA000' },
  leakCard: { backgroundColor: '#FFEBEE', borderColor: '#E53935' },
  
  // Servo Controls
  controlGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10, 
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 30,
    width: '48%',
    height: 50,
    borderWidth: 2,
  },
  controlButtonOn: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderColor: '#4CAF50',
  },
  controlButtonOff: {
    backgroundColor: 'rgba(229, 57, 53, 0.3)',
    borderColor: '#E53935',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#FFFFFF',
    shadowColor: '#fff',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  controlButtonActiveText: {
    color: '#000428',
  },
  
  // Footer Button
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 25,
  },
  bookBtnText: { color: '#004e92', fontSize: 17, fontWeight: 'bold', marginLeft: 10 },
});