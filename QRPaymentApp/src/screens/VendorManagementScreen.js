import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto'; // Import from expo-crypto

const VendorManagementScreen = () => {
  const navigation = useNavigation();
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [encryptedData, setEncryptedData] = useState('');
  const viewShotRef = useRef();

  useEffect(() => {
    const getVendorData = async () => {
      try {
        const vendorData = await AsyncStorage.getItem('vendorData');
        if (vendorData) {
          const parsedData = JSON.parse(vendorData);
          setAccountName(parsedData.business_name);
          setAccountNumber(parsedData.business_number);
        }
      } catch (error) {
        console.error('Error fetching vendor data:', error);
        Alert.alert('Error', 'Could not retrieve vendor data');
      }
    };

    getVendorData();
  }, []);

  // Key generation function
  const generateKey = (password) => {
    return CryptoJS.PBKDF2(password, 'salt', {
      keySize: 256 / 32,
      iterations: 1000,
    });
  };

  const encryptData = async (data, password) => {
    try {
      const key = generateKey(password);
      
      // Generate a random IV
      const ivBytes = await Crypto.getRandomBytesAsync(16);
      const iv = CryptoJS.lib.WordArray.create(ivBytes);

      const dataWordArray = CryptoJS.enc.Utf8.parse(data);

      const encrypted = CryptoJS.AES.encrypt(dataWordArray, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const ivHex = CryptoJS.enc.Hex.stringify(iv);

      const result = `${ivHex}:${encrypted.toString()}`;
      // console.log('Encryption details:', {
      //   originalData: data,
      //   ivHex: ivHex,
      //   encrypted: encrypted.toString(),
      // });

      return result;
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const encryptQRValue = async () => {
      if (accountName && accountNumber) {
        try {
          const dataToEncrypt = JSON.stringify({
            accountName,
            accountNumber,
          });
          const password = '4rever2moro';
          const encrypted = await encryptData(dataToEncrypt, password);
          setEncryptedData(encrypted);
        } catch (error) {
          console.error('Error in encryptQRValue:', error);
          Alert.alert('Error', 'Failed to encrypt QR data');
        }
      }
    };

    encryptQRValue();
  }, [accountName, accountNumber]);

  const handleSaveQR = async () => {
    if (!viewShotRef.current) {
      console.log('Error: viewShotRef is not available');
      return null;
    }
  
    try {
      const uri = await viewShotRef.current.capture({ format: 'png', quality: 1.0 });
      const timestamp = new Date().getTime();
      const fileUri = `${FileSystem.documentDirectory}qrcode_${timestamp}.png`; 
  
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  
      return fileUri;
    } catch (error) {
      console.error('Error in handleSaveQR:', error);
      return null;
    }
  };
    

  const handleScanQR = () => {
    navigation.navigate('Scan');
  };

  const handleShareQR = async () => {
    if (!viewShotRef.current) {
      Alert.alert('Error', 'QR Code not generated yet');
      return;
    }

    try {
      const fileUri = await handleSaveQR();

      if (!fileUri) {
        Alert.alert('Error', 'QR Code not saved. Cannot share.');
        return;
      }

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(fileUri, { mimeType: 'image/png', dialogTitle: 'Share QR Code' });
    } catch (error) {
      console.error('Error in handleShareQR:', error);
      Alert.alert('Error', `Failed to share QR Code: ${error.message}`);
    }
  };

  const handlePayForSomeone = () => {
    if (!accountName || !accountNumber) {
      Alert.alert('Error', 'Account details are missing');
      return;
    }
    navigation.navigate('AuthenticatedRoutes', {
      screen: 'Payment',
      params: { qrData: { accountName, accountNumber } },
    });
  };
  

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
        <View style={styles.qrContainer}>
          {encryptedData ? (
            <QRCode value={encryptedData} size={200} color="black" backgroundColor="white" />
          ) : (
            <Text style={{ color: 'red' }}>QR Code is not yet encrypted</Text>
          )}
        </View>
      </ViewShot>
      <Button title="Share QR Code" onPress={handleShareQR} style={styles.button} />
      <Button title="Scan QR Code" onPress={handleScanQR} style={styles.button} />
      <Button title="Pay for Someone" onPress={handlePayForSomeone} style={styles.button} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
    width: '100%',
  },
});

export default VendorManagementScreen;