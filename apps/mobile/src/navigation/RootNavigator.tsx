import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../stores/auth.store';
import LoginScreen from '../screens/common/LoginScreen';
import CitizenTabs from './CitizenTabs';
import DriverTabs from './DriverTabs';
import TpsOperatorTabs from './TpsOperatorTabs';
import CollectorTabs from './CollectorTabs';

const Stack = createNativeStackNavigator();

function getRoleNavigator(role: string) {
  switch (role) {
    case 'citizen': return CitizenTabs;
    case 'driver': return DriverTabs;
    case 'tps_operator': return TpsOperatorTabs;
    case 'collector': return CollectorTabs;
    case 'sweeper': return CitizenTabs; // Placeholder
    case 'tpst_operator': return TpsOperatorTabs; // Placeholder
    default: return CitizenTabs;
  }
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading, user, checkAuth } = useAuthStore();

  useEffect(() => { checkAuth(); }, []);

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  const RoleTabs = user ? getRoleNavigator(user.role) : CitizenTabs;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={RoleTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
