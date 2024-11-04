import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { Picker } from '@react-native-picker/picker';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('254'); // Default business phone number
  const [businessName, setBusinessName] = useState(''); // Business name
  const [fullName, setFullName] = useState(''); // Full name
  const [businessType, setBusinessType] = useState(''); // Business type
  const [idNumber, setIdNumber] = useState(''); // ID number

  const handleRegister = () => {
    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    console.log(`Registering with ${email}, ${phone}, ${businessName}, ${fullName}, ${businessType}, ID: ${idNumber} and password`);
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Vendor Registration</Text>

          {/* Full Name */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={24} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#888"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Business Name */}
          <View style={styles.inputContainer}>
            <Ionicons name="business-outline" size={24} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Business Name"
              placeholderTextColor="#888"
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>

          {/* Business Phone Number */}
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={24} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Business Phone Number"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={13} 
            />
          </View>

          {/* Business Type Dropdown */}
          <View style={styles.inputContainer}>
            <Ionicons name="business-outline" size={24} color="#888" style={styles.inputIcon} />
            <Picker
              selectedValue={businessType}
              style={styles.picker}
              onValueChange={(itemValue) => setBusinessType(itemValue)}
            >
              <Picker.Item label="Select Business Type" value="" />
              <Picker.Item label="Retail" value="retail" />
              <Picker.Item label="Wholesale" value="wholesale" />
              <Picker.Item label="Service" value="service" />
              <Picker.Item label="Manufacturing" value="manufacturing" />
              <Picker.Item label="Agriculture" value="agriculture" />
            </Picker>
          </View>

          {/* ID Number */}
          <View style={styles.inputContainer}>
            <Ionicons name="card-outline" size={24} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ID Number"
              placeholderTextColor="#888"
              value={idNumber}
              onChangeText={setIdNumber}
              keyboardType="phone-pad"
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <Button title="Register" onPress={handleRegister} style={styles.button} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80, 
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '100%',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 15,
  },
  picker: {
    flex: 1,
    color: 'white',
  },
  button: {
    marginTop: 20,
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
});

export default RegisterScreen;