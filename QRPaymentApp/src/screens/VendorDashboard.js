import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { createContext } from 'react';

// Import your existing VendorManagementScreen component
import QRCodeTab from './VendorManagementScreen';
import Dashboard from './DashBoard';
import Transactions from './Transactions';
import { useAuth } from '../utils/Auth';

const APP_VERSION = "1.0.0";
export const VendorContext = createContext(null);

const VendorDashboard = ({ route }) => {
  const navigation = useNavigation();
  const vendorData = route.params?.vendorData;
  const [activeTab, setActiveTab] = useState('home');
  const { logout } = useAuth();

  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'withdrawals':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Withdrawals</Text>
          </View>
        );
      case 'qrcode':
        return <QRCodeTab />;
      default:
        return null;
    }
  };

  return (
    <VendorContext.Provider value={vendorData}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1E1E1E" />
        <View style={styles.content}>
          {renderContent()}
        </View>
        <View style={styles.bottomNav}>
          <BottomNavButton title="Home" iconName="home" tabName="home" />
          <BottomNavButton title="Transactions" iconName="receipt" tabName="transactions" />
          <BottomNavButton title="Withdrawals" iconName="account-balance-wallet" tabName="withdrawals" />
          <BottomNavButton title="QR Code" iconName="qr-code" tabName="qrcode" />
        </View>
      </SafeAreaView>
    </VendorContext.Provider>
  );

  function BottomNavButton({ title, iconName, tabName }) {
    return (
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => setActiveTab(tabName)}
      >
        <Icon name={iconName} size={24} color={activeTab === tabName ? '#4CAF50' : '#888'} />
        <Text style={[styles.navButtonText, activeTab === tabName && styles.activeNavButtonText]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  content: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    marginTop: StatusBar.currentHeight || 0,
    padding: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#252525',
    paddingVertical: 10,
  },
  navButton: {
    alignItems: 'center',
  },
  navButtonText: {
    color: '#888',
    fontSize: 12,
  },
  activeNavButtonText: {
    color: '#4CAF50',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  contentTitle: {
    fontSize: 24,
    color: '#FFF',
    marginBottom: 20,
    fontWeight: 'bold',
  },
});

export default VendorDashboard;