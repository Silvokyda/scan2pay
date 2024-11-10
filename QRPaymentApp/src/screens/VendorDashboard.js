import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { logout } from './DashBoard';
import { createContext } from 'react';

// Import your existing VendorManagementScreen component
import QRCodeTab from './VendorManagementScreen';
import Dashboard from './DashBoard';
import Transactions from './Transactions';

const APP_VERSION = "1.0.0";
export const VendorContext = createContext(null);


const VendorDashboard = ({ route }) => {
  const navigation = useNavigation();
  const vendorData = route.params?.vendorData;
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarWidth] = useState(new Animated.Value(60)); 
  
  const toggleSidebar = () => {
    Animated.timing(sidebarWidth, {
      toValue: isSidebarCollapsed ? 250 : 60,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          onPress: () => logout(navigation),
          style: "destructive"
        }
      ]
    );
  };

  const SidebarButton = ({ title, iconName, tabName }) => (
    <TouchableOpacity
      style={[
        styles.sidebarButton,
        activeTab === tabName && styles.activeButton,
        isSidebarCollapsed && styles.collapsedSidebarButton
      ]}
      onPress={() => setActiveTab(tabName)}
    >
      <View style={[
        styles.iconContainer,
        activeTab === tabName && styles.activeIconContainer,
        isSidebarCollapsed && styles.collapsedIconContainer
      ]}>
        <Icon 
          name={iconName} 
          size={24} 
          color={activeTab === tabName ? '#FFF' : '#888'}
        />
      </View>
      {!isSidebarCollapsed && (
        <Text style={[
          styles.sidebarButtonText,
          activeTab === tabName && styles.activeButtonText
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );

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
    <View style={styles.container}>
      <Animated.View style={[styles.sidebar, { width: sidebarWidth }]}>
        <View style={[styles.sidebarHeader, isSidebarCollapsed && styles.collapsedSidebarHeader]}>
          {!isSidebarCollapsed && <Text style={styles.sidebarTitle}>Vendor Panel</Text>}
          <TouchableOpacity 
            onPress={toggleSidebar} 
            style={[styles.toggleButton, isSidebarCollapsed && styles.collapsedToggleButton]}
          >
            <Icon 
              name={isSidebarCollapsed ? 'chevron-right' : 'chevron-left'} 
              size={24} 
              color="#FFF" 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.sidebarContent}>
          <ScrollView>
            <SidebarButton title="Home" iconName="home" tabName="home" />
            <SidebarButton title="Transactions" iconName="receipt" tabName="transactions" />
            <SidebarButton title="Withdrawals" iconName="account-balance-wallet" tabName="withdrawals" />
            <SidebarButton title="QR Code" iconName="qr-code" tabName="qrcode" />
          </ScrollView>
          
          <View style={[styles.sidebarFooter, isSidebarCollapsed && styles.collapsedSidebarFooter]}>
            <TouchableOpacity 
              style={[styles.logoutButton, isSidebarCollapsed && styles.collapsedLogoutButton]}
              onPress={handleLogout}
            >
              <Icon name="logout" size={24} color="#FF4444" />
              {!isSidebarCollapsed && (
                <Text style={styles.logoutText}>Logout</Text>
              )}
            </TouchableOpacity>
            
            {!isSidebarCollapsed && (
              <Text style={styles.versionText}>v{APP_VERSION}</Text>
            )}
          </View>
        </View>
      </Animated.View>
      
      <Animated.View style={[
        styles.content,
        {
          marginLeft: sidebarWidth.interpolate({
            inputRange: [60, 250],
            outputRange: [60, 250]
          })
        }
      ]}>
        {renderContent()}
        </Animated.View>
    </View>
    </VendorContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  sidebar: {
    backgroundColor: '#252525',
    borderRightWidth: 1,
    borderRightColor: '#333',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  sidebarContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  collapsedSidebarHeader: {
    padding: 10,
    justifyContent: 'center',
  },
  toggleButton: {
    padding: 5,
  },
  collapsedToggleButton: {
    alignSelf: 'center',
  },
  sidebarTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sidebarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
  },
  collapsedSidebarButton: {
    justifyContent: 'center',
    padding: 10,
    marginHorizontal: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  collapsedIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  sidebarButtonText: {
    color: '#888',
    marginLeft: 10,
    fontSize: 16,
  },
  activeButtonText: {
    color: '#FFF',
  },
  sidebarFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  collapsedSidebarFooter: {
    padding: 10,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  collapsedLogoutButton: {
    justifyContent: 'center',
    padding: 5,
  },
  logoutText: {
    color: '#FF4444',
    marginLeft: 10,
    fontSize: 16,
  },
  versionText: {
    color: '#666',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  contentContainer: {
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