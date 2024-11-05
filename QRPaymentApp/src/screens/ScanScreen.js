import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';

const { width, height } = Dimensions.get('window');
const CAMERA_SIZE = Math.min(width * 1.2, height * 0.5);

const ScanScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanLineAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getPermissions();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(scanLineAnimation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    try {
      const parsedData = JSON.parse(data);
      console.log('Parsed QR code data:', parsedData);
      navigation.navigate('Payment', { qrData: parsedData });
    } catch (error) {
      console.error('Error parsing QR code data:', error);
      Alert.alert('Error', 'Invalid QR code format');
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.message}>We need your permission to access the camera</Text>
        <Button title="Grant permission" onPress={() => BarCodeScanner.requestPermissionsAsync()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan your QR Code </Text>
      <View style={styles.cameraContainer}>
        <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
          type={BarCodeScanner.Constants.Type.back}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerCorners}>
            <View style={[styles.scannerCorner, styles.topLeft]} />
            <View style={[styles.scannerCorner, styles.topRight]} />
            <View style={[styles.scannerCorner, styles.bottomLeft]} />
            <View style={[styles.scannerCorner, styles.bottomRight]} />
          </View>
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanLineAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, CAMERA_SIZE],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <Button title="Scan QR Code" onPress={() => { }} style={styles.button} />
        <TouchableOpacity
          onPress={async () => {
            try {
              const token = await AsyncStorage.getItem('token');

              if (token) {
                const vendorData = await AsyncStorage.getItem('vendorData');
                navigation.navigate('VendorDashboard', { vendorData: JSON.parse(vendorData) });
              } else {
                navigation.navigate('Login');
              }
            } catch (error) {
              console.error("Error checking user authentication:", error);
              navigation.navigate('Login'); 
            }
          }}
        >
          <Text style={styles.vendorText}>Are you a vendor? </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

// Define your styles
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scannerCorners: {
    flex: 1,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    borderRadius: 2,
    width: 30,
    height: 30,
    borderColor: 'white',
  },
  topLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 20,
    right: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4CAF50',
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
