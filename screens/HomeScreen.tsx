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
  Dimensions
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import LinearGradient from 'react-native-linear-gradient'; // 🎨 NEW IMPORT
import { Svg, Circle } from 'react-native-svg'; // ⭕ NEW IMPORT

// ---------- CONSTANTS (NAYE) ----------
const LOW_GAS_THRESHOLD_KG = 2.0; // Thoda badha diya
const GAS_PROVIDER_URL = 'https://portal.indianoil.in/sbw/Mobile/LPG/';
const ONLINE_THRESHOLD_SECONDS = 30;
const MAX_WEIGHT = 14.2; // Standard cylinder weight (aap badal sakte hain)
const GAUGE_SIZE = 220;
const STROKE_WIDTH = 22;
const GAUGE_RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const GAUGE_CIRCUMFERENCE = GAUGE_RADIUS * 2 * Math.PI;

const screenWidth = Dimensions.get('window').width - 40;

export default function HomeScreen({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<any>(null);
  const [gasHistory, setGasHistory] = useState<number[]>([]);
  const [now, setNow] = useState(new Date());
  const user = auth().currentUser;

  // ---------- Booking ----------
  const handleBookCylinder = () => {
    Linking.openURL(GAS_PROVIDER_URL).catch(() => {
      Alert.alert('Error', 'Could not open LPG booking website.');
    });
  };

  // ---------- Add Device ----------
  const handleAddDevice = () => {
    try {
      navigation.navigate('AddDevice');
    } catch {
      navigation.getParent()?.navigate('AddDevice');
    }
  };

  // ---------- Load Stored Graph Data on Start ----------
  useEffect(() => {
    const loadStoredHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem('gasHistory');
        if (stored) {
          setGasHistory(JSON.parse(stored));
        }
      } catch (err) {
        console.log('⚠️ Error loading stored gas history:', err);
      }
    };
    loadStoredHistory();
  }, []);

  // ---------- Firestore Listener ----------
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 5000);

    if (!user) {
      navigation.replace('Login');
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

            setDevice({
              id: doc.id,
              name: data?.name || 'Unnamed Device',
              ownerName: data?.ownerName || user.displayName || 'User',
              gasLevel: gasValue,
              weight: parseFloat(data?.weight ?? 0),
              unit: data?.unit || 'kg',
              lastUpdated,
            });

            // --- Update Graph & Save to Storage ---
            setGasHistory(prev => {
              const updated = [...prev, gasValue];
              const limited = updated.length > 10 ? updated.slice(updated.length - 10) : updated;
              AsyncStorage.setItem('gasHistory', JSON.stringify(limited)); // 💾 Save locally
              return limited;
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
  }, [user, navigation]);

  // --- Status Calculation (Logic same) ---
  const isOnline = device?.lastUpdated
    ? (now.getTime() - device.lastUpdated.getTime()) / 1000 < ONLINE_THRESHOLD_SECONDS
    : false;
  const isLowGas = device?.weight <= LOW_GAS_THRESHOLD_KG && device?.weight > 0;
  const isLeak = device?.gasLevel >= 75;

  // --- NAYA: Gauge Progress Calculation ---
  const weightPercentage = Math.min(Math.max(device?.weight / MAX_WEIGHT, 0), 1);
  const strokeDashoffset = GAUGE_CIRCUMFERENCE * (1 - weightPercentage);
  const gaugeColor = isLowGas ? '#FFA000' : (weightPercentage > 0.5 ? '#4CAF50' : '#007AFF');

  // ---------- UI (SAB NAYA DESIGN) ----------

  // 🎨 1. Loading Screen (Dark Mode)
  if (loading) {
    return (
      <LinearGradient colors={['#000428', '#004e92']} style={styles.center}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ marginTop: 10, color: '#ccc' }}>Loading dashboard...</Text>
      </LinearGradient>
    );
  }

  // 🎨 2. No Device Screen (Dark Mode)
  if (!device) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient colors={['#000428', '#004e92']} style={styles.center}>
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

  // 🎨 3. Main Dashboard (Dark Mode)
  return (
    <SafeAreaView style={styles.container}>
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
        
        {/* ⭕ NAYA: SVG Weight Gauge ⭕ */}
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

        {/* ⚠️ Alerts (High Priority) */}
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
        
        {/* Secondary Cards (Gas Level & Status) */}
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

        {/* 📊 Gas Level Graph (Dark Mode) */}
        <View style={styles.graphContainer}>
          <Text style={styles.graphTitle}>Gas Sensor Trend (PPM)</Text>
          {gasHistory.length > 1 ? (
            <LineChart
              data={{
                labels: Array.from({ length: gasHistory.length }, (_, i) => `${i + 1}`),
                datasets: [{ data: gasHistory, strokeWidth: 3 }],
              }}
              width={screenWidth}
              height={220}
              chartConfig={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backgroundGradientFrom: 'rgba(255, 255, 255, 0.05)',
                backgroundGradientTo: 'rgba(255, 255, 255, 0.05)',
                color: (opacity = 1) => `rgba(0, 150, 136, ${opacity})`, // Teal color
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#009688' },
                propsForBackgroundLines: { stroke: 'rgba(255, 255, 255, 0.1)' }
              }}
              bezier
              style={{ borderRadius: 16 }}
            />
          ) : (
            <Text style={{ color: '#888', marginTop: 10, height: 220, textAlignVertical: 'center' }}>
              Waiting for gas sensor data...
            </Text> 
            // ^^^ YEH WALA FIX THA (</ReadText> ki jagah </Text>) ^^^
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

// ---------- NAYE STYLES (DARK MODE) ----------
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
    backgroundColor: '#FFFFFF', // Primary button style
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
  graphContainer: { marginTop: 10, borderRadius: 16, padding: 10, width: '100%', alignItems: 'center' },
  graphTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 15, alignSelf: 'flex-start' },

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

  // Footer Button
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF', // Primary button
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 25,
  },
  bookBtnText: { color: '#004e92', fontSize: 17, fontWeight: 'bold', marginLeft: 10 },
});