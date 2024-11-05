import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';

const VendorManagementScreen = () => {
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const viewShotRef = useRef();

  useEffect(() => {
    const getVendorData = async () => {
      try {
        const vendorData = await AsyncStorage.getItem('vendorData');
        if (vendorData) {
          const parsedData = JSON.parse(vendorData);
          setAccountName(parsedData.accountName);
          setAccountNumber(parsedData.accountNumber);
        }
      } catch (error) {
        console.error('Error fetching vendor data:', error);
        Alert.alert('Error', 'Could not retrieve vendor data');
      }
    };

    getVendorData();
  }, []);

  const qrValue = JSON.stringify({
    accountName,
    accountNumber,
  });

  const handleSaveQR = async () => {
    if (!viewShotRef.current) {
      console.log('Error: viewShotRef is not available');
      return null;
    }

    try {
      const uri = await viewShotRef.current.capture();
      const timestamp = new Date().getTime();
      const fileUri = `${FileSystem.documentDirectory}qrcode_${timestamp}.png`;

      await FileSystem.moveAsync({
        from: uri,
        to: fileUri,
      });

      return fileUri;
    } catch (error) {
      console.error('Error in handleSaveQR:', error);
      return null;
    }
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

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
        <View style={styles.qrContainer}>
          <QRCode value={qrValue} size={200} color="black" backgroundColor="white" />
        </View>
      </ViewShot>
      <Button title="Share QR Code" onPress={handleShareQR} style={styles.button} />
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
