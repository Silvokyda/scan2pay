import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, ScrollView, Alert, Share, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import Button from '../components/Button';

const VendorManagementScreen = () => {
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [isQRVisible, setIsQRVisible] = useState(false);
  const viewShotRef = useRef();

  const handleCreateQR = () => {
    if (!accountName || !accountNumber) {
      Alert.alert('Error', 'Please enter both account name and number');
      return;
    }

    const qrData = JSON.stringify({
      accountName,
      accountNumber,
    });

    setQrValue(qrData);
    setIsQRVisible(true);
  };

  const handleTerminateQR = () => {
    setQrValue('');
    setIsQRVisible(false);
    setAccountName('');
    setAccountNumber('');
  };

  const handleSaveQR = async () => {
    if (!viewShotRef.current) {
      console.log('Error: viewShotRef is not available');
      return null;
    }
  
    try {
      const uri = await viewShotRef.current.capture();
      console.log('Captured URI:', uri);
  
      const fileUri = `${FileSystem.documentDirectory}qrcode.png`;
      console.log('Target file URI:', fileUri);
  
      await FileSystem.moveAsync({
        from: uri,
        to: fileUri,
      });
  
      console.log('File moved successfully');
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
      console.log('File URI from handleSaveQR:', fileUri);
  
      if (!fileUri) {
        Alert.alert('Error', 'QR Code not saved. Cannot share.');
        return;
      }
  
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      console.log('File info:', fileInfo);
  
      if (!fileInfo.exists) {
        Alert.alert('Error', 'File does not exist at the specified path');
        return;
      }
  
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }
  
      await Sharing.shareAsync(fileUri, { mimeType: 'image/png', dialogTitle: 'Share QR Code' });
      console.log('Shared successfully');
    } catch (error) {
      console.error('Error in handleShareQR:', error);
      Alert.alert('Error', `Failed to share QR Code: ${error.message}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Vendor Management</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Account Name"
        placeholderTextColor="#888"
        value={accountName}
        onChangeText={setAccountName}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Account Number"
        placeholderTextColor="#888"
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="numeric"
      />
      
      <Button title="Create New QR Code" onPress={handleCreateQR} style={styles.button} />
      <Button title="Terminate QR Code" onPress={handleTerminateQR} style={styles.button} />

      <Modal visible={isQRVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Your QR Code</Text>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
              <View style={styles.qrContainer}>
                <Text style={styles.scanToPay}>Scan to Pay</Text>
                {qrValue ? (
                  <QRCode value={qrValue} size={200} color="black" backgroundColor="white" />
                ) : null}
              </View>
            </ViewShot>
            <Button title="Share QR Code" onPress={handleShareQR} style={styles.button} />
            <Button title="Close" onPress={() => setIsQRVisible(false)} style={styles.closeButton} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1E1E1E',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#333',
    color: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  closeButton: {
    marginTop: 20,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
  },
  scanToPay: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
});

export default VendorManagementScreen;
