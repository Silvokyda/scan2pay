import React from 'react';
import { StatusBar } from 'react-native';  
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { CardStyleInterpolators } from '@react-navigation/stack';
import ScanScreen from './src/screens/ScanScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VendorManagementScreen from './src/screens/VendorManagementScreen';
import VendorDashboard from './src/screens/VendorDashboard';

const Stack = createStackNavigator();
export const AppUrl = 'https://cc97-102-219-210-201.ngrok-free.app';

export default function App() {
  return (
    <>
      <StatusBar backgroundColor="#2FC56D" barStyle="light-content" />
      
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            transitionSpec: {
              open: {
                animation: 'timing',
                config: { duration: 300 },
              },
              close: {
                animation: 'timing',
                config: { duration: 300 },
              },
            },
          }}
        >
          <Stack.Screen name="Scan" component={ScanScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="VendorManagement" component={VendorManagementScreen} />
          <Stack.Screen name="VendorDashboard" component={VendorDashboard} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}