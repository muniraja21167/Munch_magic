import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const OtpScreen = ({ navigation, route }) => {
  // OTP from backend (passed via navigation params)
  const { serverOtp, phone } = route.params || {};

  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = useRef([]);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (text, index) => {
    let newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputs.current[index + 1].focus();
    }
  };

  const showToast = message => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Info', message);
    }
  };

  const handleContinue = () => {
    const enteredOtp = otp.join('');

    if (enteredOtp.length !== 4) {
      showToast('❌ Please enter full OTP');
      return;
    }

    if (String(enteredOtp) === String(serverOtp)) {
      showToast('✅ OTP Verified Successfully');
      navigation.replace('HomeScreen'); 
    } else {
      showToast('❌ Invalid OTP, please try again');
    }
  };

  const handleResend = () => {
    setOtp(['', '', '', '']);
    setTimer(30);
    showToast(`📩 OTP resent to ${phone || 'your number'}`);
    
  };

  const handleCallMe = () => {
    showToast(`📞 We will call you on ${phone || 'your number'}`);
    // TODO: Implement call OTP API
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
      >
        <Ionicons name="chevron-back" size={25} color="#000" />
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Please Verify Your Account</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit code sent to {'\n'}
          {phone ? phone : '+1 (XXX) XXX-XXXX'}
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => (inputs.current[index] = ref)}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : styles.otpBoxEmpty,
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={text => handleChange(text, index)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.continueBtn,
            otp.join('').length === 4
              ? styles.continueBtnActive
              : styles.continueBtnDisabled,
          ]}
          disabled={otp.join('').length !== 4}
          onPress={handleContinue}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>

        {timer > 0 ? (
          <Text style={styles.resendText}>
            Didn’t receive the SMS? Resend in{' '}
            <Text style={styles.timer}>{timer}s</Text>
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendLink}>Resend OTP</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.orText}>Or</Text>
        <TouchableOpacity onPress={handleCallMe}>
          <Text style={styles.callText}>Call Me</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backBtn: { position: 'absolute', top: 20, left: 20, zIndex: 10 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 40,
  },
  title: { fontSize: 40, fontWeight: 'bold', marginBottom: 10 },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 30,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpBox: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
  },
  otpBoxEmpty: { borderColor: '#ddd', backgroundColor: '#fafafa' },
  otpBoxFilled: { borderColor: '#E50914', backgroundColor: '#fff' },
  continueBtn: { paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  continueBtnDisabled: { backgroundColor: '#f5a5a5' },
  continueBtnActive: { backgroundColor: '#E50914' },
  continueText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resendText: { textAlign: 'center', color: 'gray', marginTop: 12 },
  timer: { color: 'red', fontWeight: 'bold' },
  resendLink: {
    textAlign: 'center',
    color: 'red',
    fontWeight: 'bold',
    marginTop: 12,
  },
  orText: { textAlign: 'center', marginTop: 20, color: 'gray' },
  callText: {
    textAlign: 'center',
    color: 'red',
    fontWeight: 'bold',
    marginTop: 5,
  },
});

export default OtpScreen;
