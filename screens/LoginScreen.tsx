// screens/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from 'react-native-modal';

export default function LoginScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const isLoading = isEmailLoading || isGoogleLoading;

  // --- MODAL STATES ---
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  // Show popup helper
  const showPopup = (
    type: 'success' | 'error',
    title: string,
    message: string
  ) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  // Google Sign-In configuration
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '328780906303-pa0qqqkh1b9b3bnnaj2h7tg88u8overg.apps.googleusercontent.com',
    });
  }, []);

  // --- EMAIL LOGIN ---
  const handleLogin = async () => {
    if (isLoading) return;

    if (!email || !password) {
      showPopup('error', 'Missing Fields', 'Please enter email and password.');
      return;
    }

    setIsEmailLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
      
      // ✅ Show success popup immediately
      showPopup('success', 'Login Successful', 'Welcome back! Redirecting...');
      
      // ✅ Wait for popup to be visible, then navigate
      setTimeout(() => {
        setModalVisible(false);
        // Use a slight delay to ensure modal closes smoothly
        setTimeout(() => {
          navigation.replace('Tabs', { screen: 'Home' });
        }, 300);
      }, 1800);
      
    } catch (error: any) {
      console.log('Email Login Error:', error);
      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-email' ||
        error.code === 'auth/invalid-credential'
      ) {
        showPopup('error', 'Login Failed', 'Invalid email or password.');
      } else {
        showPopup('error', 'Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  // --- GOOGLE LOGIN ---
  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsGoogleLoading(true);

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken = response?.data?.idToken;

      if (!idToken) {
        throw new Error('No ID Token found. Please try again.');
      }

      // ✅ IMPORTANT: Show popup BEFORE Firebase auth
      // This prevents component unmount from hiding the popup
      console.log('✅ Showing popup BEFORE Firebase auth...');
      showPopup('success', 'Login Successful', 'Logged in with Google!');
      
      // Small delay to ensure popup renders
      await new Promise(resolve => setTimeout(resolve, 100));

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
      
      console.log('✅ Google Login Firebase success');

      // ✅ Wait for popup to show, then navigate
      setTimeout(() => {
        setModalVisible(false);
        setTimeout(() => {
          navigation.replace('Tabs', { screen: 'Home' });
        }, 300);
      }, 2000); // Increased to 2 seconds
      
    } catch (error: any) {
      console.log('Google Sign-In Error:', error);
      if (error.code === 'SIGN_IN_CANCELLED') {
        showPopup('error', 'Cancelled', 'You cancelled Google Sign-In.');
      } else if (error.code === 'IN_PROGRESS') {
        showPopup('error', 'In Progress', 'Sign-in already in progress.');
      } else {
        showPopup('error', 'Error', error.message || 'Google Sign-In failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#000428', '#004e92']} style={styles.container}>
        <StatusBar barStyle="light-content" />

        <Icon name="gas-cylinder" size={80} color="#FFFFFF" style={styles.logo} />
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {/* --- EMAIL INPUT --- */}
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
            editable={!isLoading}
          />
        </View>

        {/* --- PASSWORD INPUT --- */}
        <View style={styles.inputContainer}>
          <Icon name="lock-outline" size={20} color="#ccc" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#ccc"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />
        </View>

        {/* --- LOGIN BUTTON --- */}
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isEmailLoading ? (
            <ActivityIndicator size="small" color="#004e92" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.separatorText}>OR</Text>

        {/* --- GOOGLE BUTTON --- */}
        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
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
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')} disabled={isLoading}>
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* --- POPUP MODAL --- */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => {
          // Prevent closing on backdrop press during success
          if (modalType === 'error') {
            setModalVisible(false);
          }
        }}
        animationIn="zoomIn"
        animationOut="zoomOut"
        backdropOpacity={0.7}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}
      >
        <View style={styles.modalContent}>
          <Icon
            name={modalType === 'success' ? 'check-circle' : 'alert-circle'}
            size={60}
            color={modalType === 'success' ? '#4CAF50' : '#E53935'}
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.modalTitle}>{modalTitle}</Text>
          <Text style={styles.modalMessage}>{modalMessage}</Text>
          
          {/* Only show OK button for errors */}
          {modalType === 'error' && (
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#E53935' }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000428' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#E0E0E0', marginBottom: 30 },
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
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#FFFFFF' },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: '#FFFFFF',
  },
  buttonText: { color: '#004e92', fontSize: 18, fontWeight: 'bold' },
  separatorText: { marginVertical: 20, color: '#ccc', fontWeight: 'bold' },
  googleButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#DB4437' },
  googleButtonText: { color: '#DB4437', fontSize: 17, fontWeight: 'bold', marginLeft: 10 },
  signupContainer: { flexDirection: 'row', marginTop: 20 },
  signupText: { fontSize: 16, color: '#ccc' },
  signupButtonText: { fontSize: 16, color: '#FFFFFF', fontWeight: 'bold' },
  modalContent: {
    backgroundColor: '#1B2444',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
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
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});