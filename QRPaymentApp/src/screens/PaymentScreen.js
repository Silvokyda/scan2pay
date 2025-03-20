import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import Svg, { Path, Circle } from 'react-native-svg';
import { AppUrl } from '../config/constants';
import axios from 'axios';

const SuccessIcon = () => (
  <Svg height="100" width="100" viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#2FC56D" />
    <Path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="white" />
  </Svg>
);

const FailureIcon = () => (
  <Svg height="100" width="100" viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill="#FF6B6B" />
    <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="white" />
  </Svg>
);

const PaymentScreen = ({ route }) => {
  const [amount, setAmount] = useState('500');
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(true);
  const { qrData } = route.params;
  const navigation = useNavigation();

  useEffect(() => {
    loadSavedPhoneNumber();
  }, []);

  const loadSavedPhoneNumber = async () => {
    try {
      const savedPhone = await AsyncStorage.getItem('userPhoneNumber');
      if (savedPhone) {
        setPhoneNumber(savedPhone);
        setShowPhoneInput(false);
      }
    } catch (error) {
      console.error('Error loading saved phone number:', error);
    }
  };

  const savePhoneNumber = async (number) => {
    try {
      await AsyncStorage.setItem('userPhoneNumber', number);
    } catch (error) {
      console.error('Error saving phone number:', error);
    }
  };

  if (!qrData || !qrData.accountName || !qrData.accountNumber) {
    Alert.alert('Error', 'Invalid QR code data');
    return null;
  }

  const formatPhoneNumber = (number) => {
    const cleaned = number.replace(/[^\d]/g, '');
    if (cleaned.startsWith('0')) {
      return `254${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith('254')) {
      return cleaned;
    }
    if (cleaned.length === 9) {
      return `254${cleaned}`;
    }
    return cleaned;
  };

  const handlePayment = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);

      // Save phone number if it's the first time
      if (showPhoneInput) {
        await savePhoneNumber(formattedPhone);
        setShowPhoneInput(false);
      }

      const response = await axios.post(`${AppUrl}/pay`, {
        amount: Number(amount),
        phone_number: formattedPhone,
        customer: qrData.accountName,
        account_number: qrData.accountNumber
      });

      if (response.data.checkout_request_id) {
        setPaymentSuccess(true);
        setModalVisible(true);
        Alert.alert(
          'STK Push Sent',
          'Please check your phone and enter M-Pesa PIN to complete payment'
        );
      } else {
        throw new Error('Failed to initiate payment');
      }
    } catch (error) {
      setPaymentSuccess(true);
      setModalVisible(true);
      Alert.alert(
        'STK Push Sent',
        'Please check your phone and enter M-Pesa PIN to complete payment'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setShowPhoneInput(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    if (paymentSuccess) {
      navigation.navigate('Scan');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Screen</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Paying to: </Text>
        <Text style={styles.accountName}>{qrData.accountName}</Text>
      </View>

      {showPhoneInput ? (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.phoneInput}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="254XXX..."
            placeholderTextColor="#666"
          />
        </View>
      ) : (
        <View style={styles.savedPhoneContainer}>
          <Text style={styles.savedPhoneText}>Phone Number: {phoneNumber}</Text>
          <Button
            title="Change Number"
            onPress={handleChangeNumber}
            style={styles.changeNumberButton}
          />
        </View>
      )}

      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Select Amount</Text>
        <View style={styles.amountBox}>
          <Text style={styles.currency}>KES</Text>
          <TextInput
            style={styles.amountInput}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
      </View>

      <Button
        title={loading ? "Processing..." : "Pay"}
        onPress={handlePayment}
        style={styles.button}
        disabled={loading}
      />

      {loading && (
        <ActivityIndicator
          color="#2FC56D"
          style={styles.loader}
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            {paymentSuccess ? <SuccessIcon /> : <FailureIcon />}
            <Text style={styles.modalText}>
              {paymentSuccess ? 'STK Push Sent!' : 'Payment Failed!'}
            </Text>
            <Button
              title="Close"
              onPress={handleCloseModal}
              style={styles.closeButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginTop: 40,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#2FC56D',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  amountContainer: {
    marginBottom: 20,
  },
  amountLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
  },
  currency: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 5,
  },
  amountInput: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  button: {
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '100%',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  phoneInput: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
  savedPhoneContainer: {
    backgroundColor: '#2FC56D',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  savedPhoneText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  changeNumberButton: {
    marginTop: 10,
    backgroundColor: '#1E1E1E',
  },
});

export default PaymentScreen;