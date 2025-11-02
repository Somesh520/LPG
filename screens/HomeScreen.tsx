// screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  SafeAreaView, 
  Alert,
  TouchableOpacity,
  Linking // Booking link ke liye
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// --- CONFIGURATION ---
const LOW_GAS_THRESHOLD_KG = 1.0; 
const GAS_PROVIDER_URL = 'https://portal.indianoil.in/sbw/Mobile/LPG/'; // Example booking site

export default function HomeScreen({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<any[]>([]); 
  const user = auth().currentUser;

  // --- BOOKING FUNCTIONALITY ---
  const handleBookCylinder = () => {
      Linking.canOpenURL(GAS_PROVIDER_URL).then(supported => {
          if (supported) {
              Linking.openURL(GAS_PROVIDER_URL);
          } else {
              Alert.alert("Error", "Booking portal is not accessible.");
          }
      });
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      // Agar user logout ho jaaye to Login par bhej do
      navigation.replace('Login'); 
      return;
    }

    // --- FIRESTORE REAL-TIME LISTENER ---
    const subscriber = firestore()
      .collection('devices')
      .where('ownerId', '==', user.uid) // Sirf is user ke devices
      .onSnapshot(querySnapshot => {
        const userDevices: any[] = [];
        let lowGasAlerted = false; // Taa ki baar-baar alert na aaye

        querySnapshot.forEach(documentSnapshot => {
          const data = documentSnapshot.data();
          const currentWeight = data?.weight;
          
          // --- LOW GAS CHECK LOGIC ---
          if (currentWeight !== null && currentWeight <= LOW_GAS_THRESHOLD_KG && !lowGasAlerted) {
            Alert.alert(
              "⚠️ LOW GAS WARNING",
              `Device '${data.name}' mein gas ${LOW_GAS_THRESHOLD_KG} KG se kam bachi hai!`,
              [
                { text: "Book Now", onPress: handleBookCylinder }, // Booking option
                { text: "Later", style: 'cancel' }
              ]
            );
            lowGasAlerted = true; 
          }

          userDevices.push({
            ...data,
            id: documentSnapshot.id, // MAC Address
            lastUpdated: data.lastUpdated ? data.lastUpdated.toDate() : null, // Timestamp ko Date object mein badalna
          });
        });
        
        setDevices(userDevices);
        setLoading(false);
      }, (error) => {
        console.error("Firestore Listener Error:", error);
        Alert.alert("Error", "Could not load devices.");
        setLoading(false);
      });

    // Cleanup: Jab screen band ho, toh listener bhi band ho jaaye
    return () => subscriber();
  }, [user]);

  // --- DEVICE CARD RENDERER ---
  const renderDeviceItem = ({ item }: { item: any }) => {
    const isLowGas = item.weight !== null && item.weight <= LOW_GAS_THRESHOLD_KG;
    const isLeak = item.gasLevel !== null && item.gasLevel >= 2000; // Example: 2000 PPM = Leak
    
    return (
      <View style={styles.card}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceStatus}>ID: {item.id}</Text>
        
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Weight:</Text>
          <Text style={[
            styles.dataValue, 
            isLowGas ? styles.lowAlert : {}
          ]}>
            {item.weight === null ? 'N/A' : `${item.weight.toFixed(2)} KG`}
          </Text>
        </View>
        
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Gas Leak:</Text>
          <Text style={[
            styles.dataValue, 
            isLeak ? styles.leakAlert : {} // Leak hone par Red dikhao
          ]}>
            {item.gasLevel === null ? 'N/A' : `${item.gasLevel} PPM`}
            {isLeak ? ' (LEAK!)' : ''}
          </Text>
        </View>
        
        <Text style={styles.lastUpdated}>
          Last Update: {item.lastUpdated ? item.lastUpdated.toLocaleTimeString() : 'N/A'}
        </Text>

        {isLowGas && (
          <TouchableOpacity style={styles.bookButton} onPress={handleBookCylinder}>
            <Text style={styles.bookButtonText}>Book New Cylinder Now</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {devices.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No devices added yet.</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AddDevice')}>
            <Text style={styles.buttonText}>Add Device Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={item => item.id}
          renderItem={renderDeviceItem}
          contentContainerStyle={{paddingVertical: 10}}
        />
      )}
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  deviceStatus: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dataLabel: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  lowAlert: {
    color: 'orange', // Low Gas
    fontWeight: 'bold',
  },
  leakAlert: {
    color: 'red', // Gas Leak
    fontWeight: 'bold',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'right',
  },
  button: { // Add Device Button
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  bookButton: { // Book Cylinder Button
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});