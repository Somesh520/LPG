// screens/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  StatusBar,
  ActivityIndicator // --- NAYA IMPORT ---
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 

export default function LoginScreen({ navigation }: { navigation: any }) {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- NAYI LOADING STATES ---
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // Helper variable taaki koi bhi button disable kar sakein
  const isLoading = isEmailLoading || isGoogleLoading;

  // Google Sign-In ko configure karo
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '328780906303-pa0qqqkh1b9b3bnnaj2h7tg88u8overg.apps.googleusercontent.com',
    });
  }, []);

  // --- Email/Password Login Function (Updated) ---
  const handleLogin = async () => {
    if (isLoading) return; // Agar pehle se loading hai, toh kuch mat karo
    if (email.length === 0 || password.length === 0) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    
    setIsEmailLoading(true); // --- NAYA ---
    try {
      await auth().signInWithEmailAndPassword(email, password);
      // Success par App.tsx navigation sambhaal lega
      // Component unmount ho jaayega, state reset ki zaroorat nahi.
    } catch (error: any) {
      console.log(error);
      if (error.code === 'auth/wrong-password' || 
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Invalid email or password.');
      } else {
        Alert.alert('Error', 'An error occurred. Please try again.');
      }
      setIsEmailLoading(false); // --- NAYA: Sirf error par reset karo
    }
  };

  // --- Google Sign-In Function (Updated) ---
  const handleGoogleSignIn = async () => {
    if (isLoading) return; // --- NAYA ---

    setIsGoogleLoading(true); // --- NAYA ---
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo: any = await GoogleSignin.signIn();  
      if (!userInfo || !userInfo.data || !userInfo.data.idToken) {  
        throw new Error('Google Sign-In failed: No ID Token found.');
      }
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.data.idToken);
      await auth().signInWithCredential(googleCredential);
      Alert.alert('Success', 'Logged in with Google!');
      // App.tsx navigation sambhaal lega
    } catch (error: any) {
      console.log('Google Sign-In Error:', error);
      if (error.code === 'SIGN_IN_CANCELLED') {
        Alert.alert('Cancelled', 'Google Sign-In was cancelled.');
      } else {
        Alert.alert('Error', error.message || 'Google Sign-In failed. Please try again.');
      }
      setIsGoogleLoading(false); // --- NAYA: Sirf error par reset karo
    }
  };

  // --- NAYA CREATIVE UI (Updated) ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient 
        colors={['#000428', '#004e92']} 
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        
        <Icon name="gas-cylinder" size={80} color="#FFFFFF" style={styles.logo} />

        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
        
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
            editable={!isLoading} // --- NAYA: Loading mein disable
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
            editable={!isLoading} // --- NAYA: Loading mein disable
          />
        </View>

        {/* --- NAYA: Updated Login Button --- */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={isLoading} // Loading mein disable
        >
          {isEmailLoading ? (
            <ActivityIndicator size="small" color="#004e92" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.separatorText}>OR</Text>
        
        {/* --- NAYA: Updated Google Button --- */}
        <TouchableOpacity 
          style={[styles.button, styles.googleButton]} 
          onPress={handleGoogleSignIn}
          disabled={isLoading} // Loading mein disable
        >
          {isGoogleLoading ? (
            <ActivityIndicator size="small" color="#DB4437" />
          ) : (
            <>
              <Icon name="google" size={20} color="#DB4437" />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('SignUp')}
            disabled={isLoading} // Loading mein disable
          >
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
        
      </LinearGradient>
    </SafeAreaView>
  );
}

// --- Styles (Same) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000428', 
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    marginBottom: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    height: 50, // --- Height fix kar di taaki spinner aane par jump na kare
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: '#FFFFFF', 
  },
  buttonText: {
    color: '#004e92', 
    fontSize: 18,
    fontWeight: 'bold',
  },
  separatorText: {
    marginVertical: 20,
    color: '#ccc',
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: 'transparent', 
    borderWidth: 2,
    borderColor: '#DB4437', 
  },
  googleButtonText: {
    color: '#DB4437',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  signupText: {
    fontSize: 16,
    color: '#ccc',
  },
  signupButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  }
});