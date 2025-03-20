import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import CryptoJS from 'crypto-js';

const { width, height } = Dimensions.get('window');
const CAMERA_SIZE = Math.min(width * 1.2, height * 0.5);

const ScanScreen = ({ navigation }) => {
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  useEffect(() => {
    const checkUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const vendorData = await AsyncStorage.getItem('user');
          if (vendorData) {
            // Navigate to VendorDashboard if vendor data exists
            navigation.reset({
              index: 0,
              routes: [{ name: 'AuthenticatedRoutes', params: { screen: 'VendorDashboard', vendorData: JSON.parse(vendorData) } }],
            });
          }
        }
      } catch (error) {
        console.error('Error checking user authentication:', error);
      }
    };
    
    checkUserData();
  }, [navigation]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to access the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const generateKey = (password) => {
    return CryptoJS.enc.Hex.parse(
      CryptoJS.PBKDF2(password, 'salt', { keySize: 256 / 32, iterations: 1000 }).toString()
    );
  };

  const decryptData = (encryptedData, password) => {
    try {
      const key = generateKey(password);
      const [ivHex, encryptedText] = encryptedData.split(':');

      if (!ivHex || !encryptedText) throw new Error('Invalid encrypted data format');

      const iv = CryptoJS.enc.Hex.parse(ivHex);
      const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedText) throw new Error('Decryption failed or empty result');

      return JSON.parse(decryptedText);
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
  
    setScanned(true);
    try {
      console.log('Raw QR data:', data);
  
      const cleanData = data.trim();
      const password = '4rever2moro';
      const decryptedData = decryptData(cleanData, password);
  
      console.log('Successfully decrypted data:', decryptedData);
  
      if (!decryptedData.accountName || !decryptedData.accountNumber) {
        throw new Error('Invalid QR code data structure');
      }
  
      navigation.navigate('Payment', { qrData: decryptedData });
    } catch (error) {
      console.error('QR processing error:', error);
      Alert.alert('Error', `Failed to process QR code: ${error.message}`, [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan your QR Code</Text>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          style={{ flex: 1 }}
        />
      </View>
      <View style={styles.bottomContainer}>
        {scanned && (
          <Button title="Scan Again" onPress={() => setScanned(false)} style={styles.button} />
        )}
        <TouchableOpacity
          onPress={async () => {
            try {
              const token = await AsyncStorage.getItem('token');

              if (token) {
                const vendorData = await AsyncStorage.getItem('vendorData');
                if (vendorData) {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'AuthenticatedRoutes', params: { screen: 'VendorDashboard', vendorData: JSON.parse(vendorData) } }],
                  });
                }
              } else {
                navigation.navigate('AuthenticationScreens', { screen: 'Login' });
              }
            } catch (error) {
              console.error('Error checking user authentication:', error);
              navigation.navigate('AuthenticationScreens', { screen: 'Login' });
            }
          }}
        >
          <Text style={styles.vendorText}>Are you a vendor?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginTop: 40,
    marginBottom: 20,
  },
  cameraContainer: {
    width: CAMERA_SIZE,
    height: CAMERA_SIZE,
    overflow: 'hidden',
    borderRadius: 20,
  },
  message: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    marginBottom: 20,
  },
  vendorText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ScanScreen;
