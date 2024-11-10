import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SectionList, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { AppUrl } from '../../App';
import { logout } from './DashBoard';

const Transactions = () => {
  const [groupedTransactions, setGroupedTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      // Retrieve the token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await axios.get(`${AppUrl}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Group transactions by date and set in state
      const grouped = groupTransactionsByDate(response.data);
      setGroupedTransactions(grouped);
      setError(null);
    } catch (error) {
      console.error('Error fetching transactions:', error);

      if (error.response && error.response.status === 401) {
        setError('Authorization error: Please log in again');
        logout(navigation); // Pass navigation to logout in case of 401
      } else {
        setError('Failed to load transactions');
      }
    } finally {
      setLoading(false);
    }
  };

  const groupTransactionsByDate = (transactions) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const groups = {
      Today: [],
      Yesterday: [],
      'Last Week': [],
      'Last Month': [],
      Older: []
    };

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      
      if (isSameDay(transactionDate, today)) {
        groups.Today.push(transaction);
      } else if (isSameDay(transactionDate, yesterday)) {
        groups.Yesterday.push(transaction);
      } else if (transactionDate >= lastWeek) {
        groups['Last Week'].push(transaction);
      } else if (transactionDate >= lastMonth) {
        groups['Last Month'].push(transaction);
      } else {
        groups.Older.push(transaction);
      }
    });

    return Object.entries(groups)
      .filter(([_, data]) => data.length > 0)
      .map(([title, data]) => ({ title, data }));
  };

  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="account-balance-wallet" size={50} color="#ccc" />
      <Text style={styles.emptyStateText}>No transactions yet</Text>
      <Text style={styles.emptyStateSubText}>
        Your transactions will appear here </Text>
    </View>
  );

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, { 
          backgroundColor: item.type === 'in' ? '#4CAF5015' : '#FF545415' 
        }]}>
          <Icon 
            name={item.type === 'in' ? 'shopping-cart' : 'account-balance-wallet'} 
            size={20} 
            color={item.type === 'in' ? '#4CAF50' : '#FF5454'} 
          />
        </View>
        <View>
          <Text style={styles.customerName}>{item.customer}</Text>
          <Text style={styles.time}>{formatTime(item.date)}</Text>
        </View>
      </View>
      <Text style={[styles.amount, { 
        color: item.type === 'in' ? '#4CAF50' : '#FF5454' 
      }]}>
        {item.type === 'in' ? '+' : '-'} KES {item.amount.toLocaleString()}
      </Text>
    </View>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="filter-list" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : groupedTransactions.length === 0 ? (
        <EmptyState />
      ) : (
        <SectionList
          sections={groupedTransactions}
          renderItem={renderTransactionItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff10',
  },
  listContainer: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    backgroundColor: '#1E1E1E',
    padding: 8,
    marginVertical: 8,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
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
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
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
});

export default Transactions;