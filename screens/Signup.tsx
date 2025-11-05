// screens/SignUpScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  StatusBar // Add this
} from 'react-native';
import auth from '@react-native-firebase/auth';

// --- NAYE IMPORTS ---
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 

export default function SignUpScreen({ navigation }: { navigation: any }) {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- Sign Up Function (Logic same) ---
  const handleSignUp = async () => {
    if (email.length === 0 || password.length === 0) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      Alert.alert('Success', 'Account created successfully! Logging in...');
    } catch (error: any) { 
      console.log(error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'That email address is already in use!');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Error', 'Password should be at least 6 characters.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Please enter a valid email address.');
      } else {
        Alert.alert('Error', 'An error occurred. Please try again.');
      }
    }
  };

  // --- NAYA CREATIVE UI ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient 
        colors={['#000428', '#004e92']} 
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />

        {/* 🔹 Back Button (Naya Add Kiya Hai) */}
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* 🔹 Icon */}
        <Icon name="account-plus-outline" size={70} color="#FFFFFF" style={styles.logo} />

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Get started with your new account</Text>
        
        <View style={styles.inputContainer}>
          <Icon name="email-outline" size={20} color="#ccc" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#ccc"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Icon name="lock-outline" size={20} color="#ccc" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#ccc"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock-check-outline" size={20} color="#ccc" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#ccc"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        {/* 🔹 Sign Up Button (Login screen ke button jaisa) */}
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
        
      </LinearGradient>
    </SafeAreaView>
  );
}

// --- NAYE CREATIVE STYLES ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000428', // Gradient ka starting color
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Naya Back Button Style
  backButton: {
    position: 'absolute',
    top: 50, // Adjust karein agar status bar ki height alag hai
    left: 20,
    zIndex: 10,
    padding: 5, // Taaki touch area bada ho
  },
  logo: {
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Translucent input
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#FFFFFF',
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: '#FFFFFF', // Login screen jaisa primary button
  },
  buttonText: {
    color: '#004e92', // Gradient ka dark color
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#ccc',
  },
  loginButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  }
});