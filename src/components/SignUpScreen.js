// SignInScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  ToastAndroid,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function SignInScreen({ navigation }) {
  const [faceId, setFaceId] = useState(false);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const showToast = message => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Info', message);
    }
  };

  const handleCreateAccount = async () => {
    if (!name || !dob || !phone) {
      showToast('Please fill required fields!');
      return;
    }

    try {
      const response = await fetch(
        'http://18.219.192.152:3052/api/createCustomer',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Name: name,
            DOB: dob,
            Email: email,
            phone: phone,
          }),
        },
      );

      const result = await response.json();

      if (response.ok) {
        showToast('Account created successfully!');
        navigation.replace('Login');
      } else {
        if (
          result.message?.includes('already') ||
          result.error?.includes('already')
        ) {
          showToast('Customer already registered, please login');
        } else {
          showToast(result.message || 'Something went wrong!');
        }
      }
    } catch (error) {
      console.error(error);
      showToast('Network error, please try again!');
    }
  };

  return (
    <ImageBackground
      source={require('./assets/images/blurbackground.png')}
      style={styles.bg}
      blurRadius={5}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={25} color="#f1f1f1" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>Enter your registration details</Text>

            <View style={styles.row}>
              <Text style={styles.smallText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Name*"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Date of Birth* (YYYY-MM-DD)"
              placeholderTextColor="#aaa"
              value={dob}
              onChangeText={setDob}
            />
            <Text style={styles.info}>
              We don’t share your information. This is only to assure{'\n'} you
              are 13+ years old.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Mobile Number*"
              placeholderTextColor="#aaa"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.checkboxRow}>
              <CheckBox value={faceId} onValueChange={setFaceId} />
              <Text style={styles.checkboxLabel}>Unlock by face id</Text>
            </View>
          </ScrollView>

          {/* Bottom Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.button1}
              onPress={handleCreateAccount}
            >
              <Text style={styles.buttonText}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, resizeMode: 'cover',marginTop:-40,height:980, },
  container: { flex: 1, padding: 20,paddingVertical:80, },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  skip: {
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#fff3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  title: { fontSize: 35,  color: '#fff', paddingTop: 20 },
  subtitle: { fontSize: 19, color: '#fff', marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 15 },
  smallText: { color: '#fff', fontSize: 14 },
  loginLink: { color: 'red', fontSize: 14, fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  info: { fontSize: 12, color: '#fff', marginBottom: 12 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkboxLabel: { color: '#fff', marginLeft: 8 },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  button1: {
    backgroundColor: 'red',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
