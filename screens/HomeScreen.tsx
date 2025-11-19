

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  // Alert,
  TouchableOpacity,
  Dimensions,
  StatusBar
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import LinearGradient from 'react-native-linear-gradient';

// ... (Saare imports same hain)
import * as Animatable from 'react-native-animatable';
import Modal from 'react-native-modal'; 
import functions from '@react-native-firebase/functions';

// ... (Saare constants same hain)
const LOW_GAS_THRESHOLD_KG = 2.0; 
const ONLINE_THRESHOLD_SECONDS = 30;
const MAX_GAS_CAPACITY_KG = 14.2; 
const screenWidth = Dimensions.get('window').width - 40;

// ... (getCylinderStatusInfo function same hai)
const getCylinderStatusInfo = (gasPercentage: number, isLow: boolean, isLeak: boolean) => {
  
  if (isLeak) {
    return {
      icon: 'fire-alert', 
      color: '#B71C1C', 
    };
  }
  
  const level = Math.max(0, Math.min(100, Math.round(gasPercentage * 100)));

  if (level >= 80) {
    return { icon: 'gas-cylinder', color: '#4CAF50' }; // Full/Green
  }
  if (level >= 50) {
    return { icon: 'gas-cylinder', color: '#007AFF' }; // Blue (Medium)
  }
  if (level > 0) {
    if (isLow) {
      return { icon: 'gas-cylinder', color: '#FFA000' }; // Orange (Low)
    }
    return { icon: 'gas-cylinder', color: '#007AFF' }; // Blue
  }
  
  return { icon: 'gas-cylinder-outline', color: '#aaa' }; // Grey (Empty Outline)
};


export default function HomeScreen({ navigation }: { navigation: any }) {
  // ... (Saare hooks aur functions same hain)
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<any>(null);
  const [gasHistory, setGasHistory] = useState<number[]>([]);
  const [weightHistory, setWeightHistory] = useState<number[]>([]);
  const [now, setNow] = useState(new Date());
  const user = auth().currentUser;

  const [isModalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const [isPredicting, setIsPredicting] = useState(false);

  const showCustomAlert = (
    type: 'success' | 'error', 
    title: string, 
    message: string
  ) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };
  
  const handleBookCylinder = () => navigation.navigate('Booking');
  const handleAddDevice = () => navigation.navigate('AddDevice');

  const sendServoCommand = async (command: 'OPEN' | 'CLOSED') => {
    if (!device || !device.id) {
      showCustomAlert( 'error', 'Device Not Found', 'Cannot send command right now.');
      return;
    }
    
    console.log(`Sending command: ${command} to device: ${device.id}`);
    try {
      await firestore().collection('devices').doc(device.id).update({
        servoCommand: command,
      });
      showCustomAlert('success', 'Command Sent', `Regulator is now set to ${command}.`);
    } catch (err: any) {
      console.error("Command Error:", err);
      showCustomAlert('error', 'Command Failed', 'Please check your connection and try again.');
    }
  };

  const handlePrediction = async () => {
    if (!device || !device.id) {
        showCustomAlert('error', 'No Device', 'Please add a device first.');
        return;
    }
    
    if (!device.tareWeight) {
        showCustomAlert(
            'error', 
            'Tare Weight Not Set', 
            'Please go to Settings and set the "Empty (Tare) Weight" first.'
        );
        return;
    }

    setIsPredicting(true);

    try {
      const predict = functions().httpsCallable('predictDaysLeft');
      const result: any = await predict({ deviceId: device.id });

      if (result.data.daysLeft !== null && result.data.daysLeft !== undefined) {
        const days = result.data.daysLeft;
        const rate = result.data.avgConsumptionPerDay;
        
        showCustomAlert(
            'success',
            `Prediction: ${days} days left`,
            `Based on your usage, you use approx ${rate} KG per day.`
        );

      } else {
        showCustomAlert(
            'error', 
            'Cannot Predict Yet', 
            result.data.error || 'Waiting for more usage data.'
        );
      }

    } catch (err: any) {
      console.error("Prediction Error:", err);
      showCustomAlert(
          'error', 
          'Prediction Failed', 
          err.message || 'Cloud Function error.'
      );
    } finally {
      setIsPredicting(false);
    }
  };

  // ... (useEffect functions sab same hain)
  useEffect(() => {
    const loadStoredHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem('gasHistory');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) setGasHistory(parsed);
          else setGasHistory([]);
        } else setGasHistory([]);

        const storedWeight = await AsyncStorage.getItem('weightHistory');
        if (storedWeight) {
          const parsedWeight = JSON.parse(storedWeight);
          if (Array.isArray(parsedWeight) && parsedWeight.length > 0) setWeightHistory(parsedWeight);
          else setWeightHistory([]);
        } else setWeightHistory([]);

      } catch (err) {
        console.log('⚠️ Error loading stored history:', err);
      }
    };
    loadStoredHistory();
  }, []);

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
            const weightValue = parseFloat(data?.weight ?? 0); 

            setDevice({
              id: doc.id,
              name: data?.name || 'Unnamed Device',
              ownerName: data?.ownerName || user.displayName || 'User',
              gasLevel: gasValue,
              weight: weightValue,
              unit: data?.unit || 'kg',
              lastUpdated,
              servoStatus: data?.servoCommand || 'OPEN',
              alert: data?.alert || false,
              tareWeight: data?.tareWeight || null, 
              lowGasThreshold: data?.lowGasThreshold || null,
            });

            setGasHistory(prev => {
              if (gasValue > 0) {
                const updated = [...prev, gasValue];
                const limited = updated.length > 10 ? updated.slice(updated.length - 10) : updated;
                AsyncStorage.setItem('gasHistory', JSON.stringify(limited));
                return limited;
              }
              return prev;
            });

            setWeightHistory(prev => {
              if (weightValue > 0) {
                if (prev.length === 0 || prev[prev.length - 1] !== weightValue) {
                  const updated = [...prev, weightValue];
                  const limited = updated.length > 10 ? updated.slice(updated.length - 10) : updated;
                    AsyncStorage.setItem('weightHistory', JSON.stringify(limited));
                  return limited;
                }
              }
              return prev;
            });

          } else {
            setDevice(null);
          }
          setLoading(false);
        },
        err => {
          console.error('❌ Firestore error:', err);
          showCustomAlert(
            'error',
            'Connection Error',
            'Could not load device data.'
          );
          setLoading(false);
        },
      );

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [user]);

  // ... (Status calculations sab same hain)
  const isOnline = device?.lastUpdated
    ? (now.getTime() - device.lastUpdated.getTime()) / 1000 < ONLINE_THRESHOLD_SECONDS
    : false;
  const lowGasLimit = device?.lowGasThreshold || LOW_GAS_THRESHOLD_KG; 
  const gasLeft = Math.max(0, (device?.weight || 0) - (device?.tareWeight || 0));
  const isLowGas = gasLeft <= lowGasLimit && gasLeft > 0;
  const isLeak = device?.alert === true;
  const gasPercentage = MAX_GAS_CAPACITY_KG > 0 ? (gasLeft / MAX_GAS_CAPACITY_KG) : 0;


  // ... (Loading Screen same hai)
  if (loading) {
    return (
      <LinearGradient colors={['#000428', '#004e92']} style={styles.center}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ marginTop: 10, color: '#ccc' }}>Loading dashboard...</Text>
      </LinearGradient>
    );
  }

  // ... (No Device Screen same hai)
  if (!device) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient colors={['#000428', '#004e92']} style={styles.center}>
          <StatusBar barStyle="light-content" />
          <Animatable.View animation="pulse" easing="ease-out" iterationCount="infinite">
            <Icon name="gas-cylinder-outline" size={70} color="#FFFFFF" />
          </Animatable.View>
          <Animatable.Text style={styles.empty} animation="fadeInUp" delay={100}>
            No device linked yet
          </Animatable.Text>
          <Animatable.Text style={styles.emptySubtitle} animation="fadeInUp" delay={200}>
            Let's add your Smart Guardian
          </Animatable.Text>
          <Animatable.View animation="fadeInUp" delay={300}>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddDevice}>
              <Icon name="plus" size={20} color="#004e92" />
              <Text style={styles.addBtnText}>Add New Device</Text>
            </TouchableOpacity>
          </Animatable.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // 🎨 3. Main Dashboard (Final Return)
  return (
    <SafeAreaView style={styles.container}>
      {/* ... (Gradient, Header, Gauge, Prediction Button, Alerts... sab same hain) ... */}
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000428', '#004e92']} style={StyleSheet.absoluteFillObject} />
      
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header */}
        <Animatable.View animation="fadeInDown" duration={600}>
          <View style={styles.header}>
            <Text style={styles.deviceName}>{device.name}</Text>
            <Animatable.View 
              animation={isOnline ? "pulse" : undefined} 
              easing="ease-out" 
              iterationCount="infinite"
              style={[styles.statusBadge, isOnline ? styles.online : styles.offline]}
            >
              <Icon name={isOnline ? 'wifi' : 'wifi-off'} size={16} color="#fff" />
              <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </Animatable.View>
          </View>
          <Text style={styles.ownerText}>👤 {device.ownerName}</Text>
        </Animatable.View>
        
        {/* Dynamic Cylinder Gauge (Updated) */}
        <Animatable.View animation="zoomIn" duration={800} delay={200} style={styles.batteryContainer}>
           {(() => {
            const cylinderInfo = getCylinderStatusInfo(gasPercentage, isLowGas, isLeak);
            return (
              <>
                <Icon name={cylinderInfo.icon} size={100} color={cylinderInfo.color} />
                <View style={styles.batteryTextContainer}>
                  <Text style={[styles.batteryValue, { color: cylinderInfo.color }]}>
                    {(gasPercentage * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.batteryLabel}>
                    ({gasLeft.toFixed(2)} KG left)
                  </Text>
                </View>
              </>
            );
          })()}
        </Animatable.View>

        {/* Prediction Button */}
        <Animatable.View animation="fadeInUp" delay={300}>
          <TouchableOpacity 
            style={styles.predictButton} 
            onPress={handlePrediction}
            disabled={isPredicting}
          >
            {isPredicting ? (
              <ActivityIndicator color="#004e92" />
            ) : (
              <>
                <Icon name="brain" size={20} color="#004e92" />
                <Text style={styles.predictButtonText}>Predict Days Left</Text>
              </>
            )}
          </TouchableOpacity>
        </Animatable.View>

        {/* Alerts */}
        {isLeak && (
          <Animatable.View 
            animation="shake"
            iterationCount="infinite" 
            duration={2000}
            style={[styles.alertBox, styles.leakCard]}
          >
            <Icon name="fire-alert" size={24} color="#B71C1C" />
            <View style={styles.alertTextBox}>
              <Text style={[styles.alertTitle, { color: '#B71C1C' }]}>GAS LEAK DETECTED!</Text>
              <Text style={[styles.alertText, { color: '#B71C1C' }]}>
                Turn off main valve immediately and ventilate the area!
              </Text>
            </View>
          </Animatable.View>
        )}
        {isLowGas && !isLeak && (
          <Animatable.View 
            animation="pulse"
            easing="ease-out"
            iterationCount="infinite"
            style={[styles.alertBox, styles.warningCard]}
          >
            <Icon name="alert-outline" size={24} color="#E65100" />
            <View style={styles.alertTextBox}>
              <Text style={[styles.alertTitle, { color: '#E65100' }]}>Low Gas Warning</Text>
              <Text style={[styles.alertText, { color: '#E65100' }]}>
                Gas is below {lowGasLimit} KG. Please book a new cylinder.
              </Text>
            </View>
          </Animatable.View>
        )}
        
        {/* ⭐️ YEH RAHA SAHI SERVO CONTROLS (JSX Update) ⭐️ */}
        <Animatable.View 
          animation="fadeInUp"
          duration={600}
          delay={400} 
          style={styles.controlGroup}
        >
            {/* --- MANUAL ON BUTTON --- */}
            <TouchableOpacity
                style={[
                styles.controlButton,
                // Agar (OPEN hai AND leak nahi hai) TO active style, WARNA inactive style
                (device.servoStatus === 'OPEN' && !isLeak) 
                    ? styles.controlButtonOnActive 
                    : styles.controlButtonOn
                ]}
                onPress={() => sendServoCommand('OPEN')}
                disabled={isLeak} // Leak hone par ON button disable
            >
                <Icon name="valve-open" size={20} color={'#FFFFFF'} /> 
                <Text style={styles.controlButtonText}>
                Manual ON
                </Text>
            </TouchableOpacity>

            {/* --- MANUAL OFF BUTTON --- */}
            <TouchableOpacity
                style={[
                styles.controlButton,
                // Agar (CLOSED hai YA leak hai) TO active style, WARNA inactive style
                (device.servoStatus === 'CLOSED' || isLeak) 
                    ? styles.controlButtonOffActive 
                    : styles.controlButtonOff
                ]}
                onPress={() => sendServoCommand('CLOSED')}
            >
                <Icon name="valve-closed" size={20} color={'#FFFFFF'} />
                <Text style={styles.controlButtonText}>
                Manual OFF
                </Text>
            </TouchableOpacity>
        </Animatable.View>

        {/* ... (Cards, Graph, Button, Modal... sab same hain) ... */}
        
        {/* Secondary Cards */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={500} 
          style={styles.cardsRow}
        >
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
        </Animatable.View>

        {/* Gas Level Graph */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={600}
          style={styles.graphContainer}
        >
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
        </Animatable.View>

        {/* Footer Button */}
        {isLowGas && (
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={700}
          >
            <TouchableOpacity style={styles.bookBtn} onPress={handleBookCylinder}>
              <Icon name="phone" size={20} color="#004e92" />
              <Text style={styles.bookBtnText}>Book New Cylinder</Text>
            </TouchableOpacity>
          </Animatable.View>
        )}
      </ScrollView>

      {/* Chatbot Button (FAB) */}
      <Animatable.View 
        animation="zoomIn"
        delay={1000}
        duration={500}
        style={styles.chatButtonContainer}
      >
        <TouchableOpacity 
          style={styles.chatButton} 
          onPress={() => navigation.navigate('Chatbot')}
        >
          <Icon name="robot" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </Animatable.View>


      {/* Custom Modal Pop-up */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        onBackButtonPress={() => setModalVisible(false)}
        animationIn="zoomIn"
        animationOut="zoomOut"
        backdropOpacity={0.7}
      >
        <View style={styles.modalContent}>
          <Icon 
            name={modalType === 'success' ? 'check-circle' : 'alert-circle'}
            size={50}
            color={modalType === 'success' ? '#4CAF50' : '#E53935'}
            style={{ marginBottom: 15 }}
          />
          <Text style={styles.modalTitle}>{modalTitle}</Text>
          <Text style={styles.modalMessage}>{modalMessage}</Text>
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ---------- ⭐️ STYLES (Control Button styles update kiye gaye) ⭐️ ----------
const styles = StyleSheet.create({
  // ... (container se lekar baaki sab same hain)
  container: { flex: 1, backgroundColor: '#000428' },
  scroll: { padding: 20, paddingBottom: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 5 },
  deviceName: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  ownerText: { fontSize: 16, color: '#aaa', marginBottom: 25, width: '100%' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  online: { backgroundColor: '#4CAF50' },
  offline: { backgroundColor: '#E53935' },
  statusText: { color: '#fff', marginLeft: 5, fontWeight: '600', fontSize: 14 },
  batteryContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    paddingVertical: 20,
    flexDirection: 'row',
  },
  batteryTextContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 15,
  },
  batteryValue: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF', 
  },
  batteryLabel: {
    fontSize: 18,
    color: '#aaa',
    marginTop: 0,
  },
  predictButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF', 
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 0,
    marginBottom: 20, 
    shadowColor: '#fff',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  predictButtonText: {
    color: '#004e92',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
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
  
  // ⭐️ YAHAN SE STYLES UPDATE HUE HAIN ⭐️
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
    borderWidth: 2, // Outline ke liye
  },
  // Inactive ON Button (Sirf outline)
  controlButtonOn: {
    backgroundColor: 'transparent', // ⭐️ Change
    borderColor: '#4CAF50',
  },
  // Inactive OFF Button (Sirf outline)
  controlButtonOff: {
    backgroundColor: 'transparent', // ⭐️ Change
    borderColor: '#E53935',
  },
  // Active ON Button (Solid Green)
  controlButtonOnActive: {
    backgroundColor: '#4CAF50', // ⭐️ Naya
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  // Active OFF Button (Solid Red)
  controlButtonOffActive: {
    backgroundColor: '#E53935', // ⭐️ Naya
    borderColor: '#E53935',
    shadowColor: '#E53935',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  // Text hamesha white
  controlButtonText: {
    color: '#FFFFFF', // ⭐️ Hamesha white
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // Yeh styles ab use nahi ho rahe (DELETE KAR DIYE)
  // controlButtonActive: { ... }
  // controlButtonActiveText: { ... }
  
  // ⭐️ YAHAN TAK STYLES UPDATE HUE HAIN ⭐️

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
  chatButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  chatButton: {
    backgroundColor: '#007AFF', 
    width: 60,
    height: 60,
    borderRadius: 30,      
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,          
    shadowColor: '#000',   
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalContent: {
    backgroundColor: '#1A233C',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});