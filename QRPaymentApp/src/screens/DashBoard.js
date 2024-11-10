import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AppUrl } from '../../App';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { VendorContext } from './VendorDashboard';

export const logout = async (navigation) => {
  try {
    await AsyncStorage.clear();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

const Dashboard = () => {
  const navigation = useNavigation();
  const vendorData = useContext(VendorContext);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [activeTab, setActiveTab] = useState('in');
  const [balance] = useState(vendorData?.balance || 0);
  const fadeAnim = new Animated.Value(1);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      // Retrieve the token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
  
      const response = await axios.get(`${AppUrl}/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      setTransactions(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching transactions:', error);

      if (error.response && error.response.status === 401) {
        setError('Authorization error: Please log in again');
        logout(navigation);
      } else {
        setError('Failed to load transactions');
      }
    } finally {
      setIsLoading(false);
    }
  };  
  
  const toggleBalance = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        delay: 100,
      }),
    ]).start(() => {
      setIsBalanceHidden(!isBalanceHidden);
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning 👋';
    if (hour < 17) return 'Good afternoon 👋';
    return 'Good evening 👋';
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="account-balance-wallet" size={50} color="#ccc" />
      <Text style={styles.emptyStateText}>No transactions yet</Text>
      <Text style={styles.emptyStateSubText}>
        Your transactions will appear here </Text>
    </View>
  );

  const filteredTransactions = transactions.filter(
    transaction => transaction.type === activeTab
  );

  const TransactionCard = ({ transaction, type }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, {
          backgroundColor: type === 'in' ? '#4CAF5015' : '#FF545415'
        }]}>
          <Icon
            name={type === 'in' ? 'shopping-cart' : 'account-balance-wallet'}
            size={20}
            color={type === 'in' ? '#4CAF50' : '#FF5454'}
          />
        </View>
        <View>
          <Text style={styles.transactionTitle}>
            {transaction.customer}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(transaction.date).toLocaleString()}
          </Text>
        </View>
      </View>
      <Text style={[styles.transactionAmount, {
        color: type === 'in' ? '#4CAF50' : '#FF5454'
      }]}>
        {type === 'in' ? '+' : '-'} KES {transaction.amount.toLocaleString()}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.greetingContainer}>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.userName}> {vendorData?.vendorName?.split(' ')[0]}</Text>
      </View>
      <View style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <Text style={styles.walletTitle}>Wallet Balance</Text>
          <TouchableOpacity onPress={toggleBalance} style={styles.eyeButton}>
            <Icon
              name={isBalanceHidden ? 'visibility-off' : 'visibility'}
              size={22}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
        <Animated.Text style={[styles.balance, { opacity: fadeAnim }]}>
          KES {isBalanceHidden ? '••••••' : balance.toLocaleString()}
        </Animated.Text>
        <Text style={styles.lastUpdated}>
          Last updated: {new Date().toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'in' && styles.activeTab]}
          onPress={() => setActiveTab('in')}
        >
          <Icon
            name="trending-up"
            size={20}
            color={activeTab === 'in' ? '#4CAF50' : '#888'}
          />
          <Text style={[styles.tabText, activeTab === 'in' && styles.activeTabText]}>
            Money In
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'out' && styles.activeTab]}
          onPress={() => setActiveTab('out')}
        >
          <Icon
            name="trending-down"
            size={20}
            color={activeTab === 'out' ? '#FF5454' : '#888'}
          />
          <Text style={[styles.tabText, activeTab === 'out' && styles.activeTabText]}>
            Money Out
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsList}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState />
        ) : (
          filteredTransactions.map(transaction => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              type={transaction.type}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  walletCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    elevation: 8,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletTitle: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '500',
    opacity: 0.9,
  },
  eyeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff10',
  },
  balance: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
    marginVertical: 8,
    letterSpacing: 0.5,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.5,
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#ffffff10',
  },
  tabText: {
    color: '#888',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFF',
  },
  transactionsList: {
    paddingHorizontal: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    color: '#888',
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 20,
    color: '#FFF',
    opacity: 0.9,
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#333',
    marginTop: 10,
    fontWeight: '500',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    color: '#FF5454',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default Dashboard;