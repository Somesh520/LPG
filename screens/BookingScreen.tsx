// screens/BookingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Linking,
  StatusBar, // 🎨 Naya import
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient'; // 🎨 Naya import
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // 🎨 Naya import

// screens/BookingScreen.tsx (Sirf updated part)

// ... (saare imports waise hi rahenge)

const GAS_COMPANIES = [
  {
    name: 'Indane Gas',
    missedCall: '8454955555',
    website: 'https://cx.indianoil.in',
  },
  {
    name: 'Bharat Gas',
    missedCall: '7710192345',
    website: 'https://my.ebharatgas.com',
  },
  {
    name: 'HP Gas',
    missedCall: '9493602222',
    website: 'https://www.hindustanpetroleum.com/hp-gas',
  },
];


// ... (baaki poora component code waise ka waisa rahega)
export default function BookingScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  // 🔹 Function to handle booking (Logic same)
  const handleBooking = async () => {
    if (!selected) {
      Alert.alert('Select Company', 'Please select your gas provider first.');
      return;
    }

    const company = GAS_COMPANIES.find(c => c.name === selected);
    if (!company) return;

    Alert.alert(
      'Confirm Booking',
      `You are booking ${company.name}. Choose your preferred method.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '🌐 Go to Website',
          onPress: () => {
            Linking.openURL(company.website).catch(() =>
              Alert.alert('Error', 'Unable to open booking website.')
            );
          },
        },
        {
          text: '📞 Book via Missed Call',
          onPress: async () => {
            const dialURL = `tel:${company.missedCall}`;
            try {
              await Linking.openURL(dialURL);
            } catch (err) {
              console.log('Dial Error:', err);
              Alert.alert(
                'Dial Error',
                'Unable to open phone dialer. Please call manually: ' + company.missedCall
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // --- 🎨 NAYA CREATIVE UI ---
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#000428', '#004e92']}
        style={StyleSheet.absoluteFillObject}
      />
      <StatusBar barStyle="light-content" />

      <Text style={styles.title}>Book Your LPG Cylinder</Text>
      <Text style={styles.infoText}>
        Select your gas provider. We will help you book via their website or missed call service.
      </Text>

      <View style={styles.optionsContainer}>
        {GAS_COMPANIES.map(company => (
          <TouchableOpacity
            key={company.name}
            style={[
              styles.optionCard, // Naya style
              selected === company.name && styles.optionSelected, // Naya style
            ]}
            onPress={() => setSelected(company.name)}
          >
            {/* 🎨 Naya icon */}
            <Icon
              name={selected === company.name ? 'radiobox-marked' : 'radiobox-blank'}
              size={26}
              color={selected === company.name ? '#FFFFFF' : '#aaa'}
            />
            {/* 🎨 Naya text layout */}
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionName}>{company.name}</Text>
              <Text style={styles.optionDetail}>Missed Call: {company.missedCall}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🎨 Naya primary button style */}
      <TouchableOpacity
        style={[styles.bookButton, !selected && styles.bookButtonDisabled]}
        onPress={handleBooking}
        disabled={!selected}
      >
        <Icon name="phone-outgoing" size={20} color={!selected ? '#aaa' : '#004e92'} />
        <Text style={[styles.bookButtonText, !selected && { color: '#aaa' }]}>
          Proceed to Booking
        </Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Note: This will open your phone's dialer or web browser.
      </Text>
    </SafeAreaView>
  );
}

// ---------- NAYE CREATIVE STYLES ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000428', // Base color
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Translucent
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent', // Default no border
  },
  optionSelected: {
    borderColor: '#FFFFFF', // White border when selected
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Thoda bright
  },
  optionTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  optionName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  optionDetail: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: '#FFFFFF', // Primary button style
    flexDirection: 'row',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
  },
  bookButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Thoda dull
  },
  bookButtonText: {
    color: '#004e92', // Primary button text
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  note: {
    marginTop: 'auto', // Neeche push karega
    paddingTop: 20,
    color: '#aaa',
    textAlign: 'center',
    fontSize: 13,
  },
});