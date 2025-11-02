// screens/SettingsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';

const handleLogout = () => {
    Alert.alert(
        "Logout",
        "Kya aap sach mein logout karna chahte hain?",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", onPress: () => auth().signOut() } // onAuthStateChanged App.tsx ko sambhaal lega
        ]
    );
};

export default function SettingsScreen() {
  const user = auth().currentUser;
  const userName = user ? user.email : 'Guest';

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>App Settings</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.label}>Logged in as:</Text>
        <Text style={styles.value}>{userName}</Text>
      </View>
      
      <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Feature', 'Device password change ka feature yahaan aayega.')}>
        <Text style={styles.settingText}>Change Device Wi-Fi</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Feature', 'User profile update ka feature yahaan aayega.')}>
        <Text style={styles.settingText}>Update Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    infoBox: {
        marginBottom: 30,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8
    },
    label: {
        fontSize: 16,
        color: '#666',
    },
    value: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    settingItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    settingText: {
        fontSize: 18,
        color: '#333',
    },
    logoutButton: {
        marginTop: 40,
        backgroundColor: '#DB4437', // Red for danger/logou
        padding: 15,
        borderRadius: 30,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    }
});