import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';
import Svg, { Path, Circle } from 'react-native-svg';

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
  const { qrData } = route.params;
  const navigation = useNavigation();

  if (!qrData || !qrData.accountName || !qrData.accountNumber) {
    Alert.alert('Error', 'Invalid QR code data');
    return null;
  }

  const handlePayment = () => {
    // Simulating payment process
    setTimeout(() => {
      const success = Math.random() > 0.5; 
      setPaymentSuccess(success);
      setModalVisible(true);
    }, 2000);
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
        <Text style={styles.cardTitle}>Receiving Account</Text>
        <Text style={styles.accountName}>{qrData.accountName}</Text>
        <Text style={styles.accountNumber}>{qrData.accountNumber}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Select Amount</Text>
        <View style={styles.amountBox}>
          <Text style={styles.currency}>KES</Text>
          <Text style={styles.amount}>{amount}</Text>
        </View>
      </View>
      <Button title="Pay" onPress={handlePayment} style={styles.button} />

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
              {paymentSuccess ? 'Payment Successful!' : 'Payment Failed!'}
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
  accountNumber: {
    color: 'white',
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
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
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
      height: 2
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
});

export default PaymentScreen;