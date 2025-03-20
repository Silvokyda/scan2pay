import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { CardStyleInterpolators } from '@react-navigation/stack';
import ScanScreen from './src/screens/ScanScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VendorManagementScreen from './src/screens/VendorManagementScreen';
import VendorDashboard from './src/screens/VendorDashboard';
import { AuthProvider, useAuth } from './src/utils/Auth';

const AuthStack = createStackNavigator();
const PublicStack = createStackNavigator();
const RootStack = createStackNavigator();

const PublicRoutes = () => (
  <PublicStack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    }}
  >
    <PublicStack.Screen name="Scan" component={ScanScreen} />
  </PublicStack.Navigator>
);

const AuthenticatedRoutes = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    }}
  >
    <AuthStack.Screen name="VendorDashboard" component={VendorDashboard} />
    <AuthStack.Screen name="Payment" component={PaymentScreen} />
    <AuthStack.Screen name="VendorManagement" component={VendorManagementScreen} />
  </AuthStack.Navigator>
);

const AuthenticationScreens = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

const Navigation = () => {
  const { checkAuthState } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authState = await checkAuthState();
        setIsAuthenticated(authState);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2FC56D" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName="PublicRoutes"
        screenOptions={{
          headerShown: false,
        }}
      >
        <RootStack.Screen name="PublicRoutes" component={PublicRoutes} />
        <RootStack.Screen name="AuthenticatedRoutes" component={AuthenticatedRoutes} />
        <RootStack.Screen name="AuthenticationScreens" component={AuthenticationScreens} />
        <RootStack.Screen name="Payment" component={PaymentScreen} /> 
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  if (hasError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Something went wrong
        </Text>
        <Text style={{ textAlign: 'center' }}>
          {error?.toString() || 'Unknown error occurred'}
        </Text>
      </View>
    );
  }

  try {
    return children;
  } catch (err) {
    console.error('Caught error:', err);
    setError(err);
    setHasError(true);
    return null;
  }
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar backgroundColor="#2FC56D" barStyle="light-content" />
        <Navigation />
      </AuthProvider>
    </ErrorBoundary>
  );
}