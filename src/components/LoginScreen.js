import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ImageBackground,
  SafeAreaView,
  Image,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Login = ({ navigation }) => {
  const [mobile, setMobile] = useState('7899635369');
  const [faceId, setFaceId] = useState(false);

  const showToast = message => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Info', message);
    }
  };

  const handleLogin = async () => {
    if (!mobile) {
      showToast('Please enter your mobile number');
      return;
    }

    try {
      const response = await fetch('http://18.219.192.152:3052/api/logIn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mobile }),
      });

      let result = {};
      try {
        result = await response.json();
      } catch (e) {
        console.error('JSON parse error:', e);
      }

      console.log('API Response:', result);
      console.log('OTP value:', result.data[0].otp);

      if (response.ok) {
        if (result.Success || result.success) {
          // Extract OTP from the nested data structure
          const serverOtp = result.data && result.data[0] ? result.data[0].otp : '1234';
          showToast('Login successful. OTP sent!');
          // Navigate to OtpScreen and pass OTP
          navigation.replace('OtpScreen', { serverOtp, phone: mobile });
        } else {
          showToast(result.message || 'Please enter valid phone number');
        }
      } else {
        showToast(result.message || 'Invalid phone number');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error, please try again');
    }
  };

  return (
    <ImageBackground
      source={require('./assets/images/blurbackground.png')}
      style={styles.bg}
      blurRadius={8}
      resizeMode="cover"
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <SafeAreaView style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={25} color="#fff" />
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => navigation.replace('Home')}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Log into your account</Text>

        {/* Input */}
        <TextInput
          style={styles.input}
          placeholder="Mobile Number"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          value={mobile}
          onChangeText={setMobile}
        />

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueBtn} onPress={handleLogin}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>

        {/* Face ID */}
        <View style={styles.checkboxContainer}>
          <CheckBox
            value={faceId}
            onValueChange={setFaceId}
            tintColors={{ true: '#fff', false: '#fff' }}
          />
          <Text style={styles.checkboxText}>Unlock by face id</Text>
        </View>

        {/* OR Divider */}
        <View style={styles.orContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        {/* Facebook Button */}
        <TouchableOpacity style={styles.fbBtn}>
          <View style={styles.socialContent}>
            <Image
              source={require('./assets/images/facebook.png')}
              style={styles.socialIcon}
            />
            <Text style={styles.fbText}>Continue with Facebook</Text>
          </View>
        </TouchableOpacity>

        {/* Google Button */}
        <TouchableOpacity style={styles.googleBtn}>
          <View style={styles.socialContent}>
            <Image
              source={require('./assets/images/google.png')}
              style={styles.socialIcon}
            />
            <Text style={styles.googleText}>Continue with Google</Text>
          </View>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerText}>
          Don’t have an account?{' '}
          <Text
            style={styles.signUp}
            onPress={() => navigation.navigate('SignUp')}
          >
            Sign up
          </Text>
        </Text>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1, resizeMode: 'cover', marginTop: -40, height: 980 },
  container: {
    marginTop: 40,
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 1 },
  skipBtn: { position: 'absolute', top: 50, right: 20, zIndex: 1 },
  skipText: { fontSize: 16, color: '#fff' },
  title: { fontSize: 40, color: '#fff' },
  subtitle: { fontSize: 16, color: '#ddd', marginBottom: 20 },
  input: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 18,
  },
  continueBtn: {
    backgroundColor: '#E42021',
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  continueText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxText: { color: '#fff' },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  line: { flex: 1, height: 1, backgroundColor: '#fff' },
  orText: { marginHorizontal: 10, color: '#fff' },
  fbBtn: {
    backgroundColor: '#395795',
    height: 50,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fbText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  googleBtn: {
    backgroundColor: '#fff',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  googleText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  socialContent: { flexDirection: 'row', alignItems: 'center' },
  socialIcon: { width: 24, height: 24, resizeMode: 'contain' },
  footerText: {
    marginTop: 254,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 20,
  },
  signUp: { color: '#E50914', fontWeight: 'bold' },
});

export default Login;
