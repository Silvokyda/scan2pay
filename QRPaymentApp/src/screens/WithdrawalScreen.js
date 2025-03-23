import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView,
  Platform,
  ScrollView 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AppUrl } from '../config/constants';
import Button from '../components/Button';

const WithdrawalScreen = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    fetchBalance();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('vendorData');
      const businessNumber = await AsyncStorage.getItem('businessNumber');
      if (userData) {
        const parsedData = JSON.parse(userData);
        setPhone(parsedData.phone_number || '');
        setBusinessNumber(parsedData.business_number || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await axios.get(`${AppUrl}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBalance(response.data.balance || 0);
      setError(null);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setError('Failed to load balance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (parseFloat(amount) > balance) {
      Alert.alert('Insufficient Balance', 'Your withdrawal amount exceeds your available balance');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await axios.post(
        `${AppUrl}/withdraw`,
        { 
          amount: parseFloat(amount), 
          phone: phone, 
          business_number: businessNumber 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  

      setSuccess(true);
      setAmount('');
      setPhone('');
      
      fetchBalance();
      
      Alert.alert(
        'Success', 
        'Your withdrawal request has been processed. You will receive the funds shortly.'
      );
    } catch (error) {
      console.error('Withdrawal error:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          Alert.alert('Session Expired', 'Please log in again.');
          navigation.reset({
            index: 0,
            routes: [{ name: 'PublicRoutes' }],
          });
        } else {
          setError(error.response.data.message || 'Withdrawal failed. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Withdraw Funds</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>KES {balance.toLocaleString()}</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Amount to Withdraw (KES)</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>KES</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.inputLabel}>M-Pesa Phone Number</Text>
          <View style={styles.inputContainer}>
            <Icon name="phone" size={20} color="#4CAF50" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="07XXXXXXXX"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
            />
          </View>

          <Button
            title={loading ? 'Processing...' : 'Withdraw'}
            onPress={handleWithdrawal}
            disabled={loading || !amount || !phone}
            style={styles.withdrawButton}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2A2A2A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  balanceCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    margin: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 8,
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    paddingVertical: 12,
  },
  withdrawButton: {
    marginTop: 10,
  },
  errorText: {
    color: '#FF5454',
    marginTop: 12,
    textAlign: 'center',
  },
  recentWithdrawals: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 0,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF545415',
    marginRight: 12,
  },
  withdrawalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  withdrawalPhone: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  withdrawalStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  withdrawalDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
});

export default WithdrawalScreen;