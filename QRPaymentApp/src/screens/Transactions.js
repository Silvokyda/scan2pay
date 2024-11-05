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

const Transactions = () => {
  const [groupedTransactions, setGroupedTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sample transaction data
  const mockTransactions = [
    {
      id: '1',
      type: 'in',
      amount: 2500,
      date: '2024-03-04T14:30:00',
      customer: 'John Doe'
    },
    {
      id: '2',
      type: 'in',
      amount: 3700,
      date: '2024-03-03T11:20:00',
      customer: 'Jane Smith'
    },
    {
      id: '3',
      type: 'out',
      amount: 1500,
      date: '2024-02-28T16:45:00',
      customer: 'Withdrawal'
    },
    {
      id: '4',
      type: 'in',
      amount: 2500,
      date: '2024-11-03T14:30:00',
      customer: 'John Doe'
    },
    {
      id: '5',
      type: 'in',
      amount: 2500,
      date: '2024-11-02T14:30:00',
      customer: 'John Doe'
    },
    {
      id: '6',
      type: 'in',
      amount: 2500,
      date: '2024-11-01T14:30:00',
      customer: 'John Doe'
    },
    {
      id: '7',
      type: 'in',
      amount: 2500,
      date: '2024-11-04T14:30:00',
      customer: 'John Doe'
    },
    // Add more transactions...
  ];

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const grouped = groupTransactionsByDate(mockTransactions);
      setGroupedTransactions(grouped);
      setLoading(false);
    }, 1000);
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

      <SectionList
        sections={groupedTransactions}
        renderItem={renderTransactionItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={true}
      />

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color="#4CAF50" />
        </View>
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
});

export default Transactions;