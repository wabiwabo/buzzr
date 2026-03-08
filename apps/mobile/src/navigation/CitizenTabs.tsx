import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import BerandaScreen from '../screens/citizen/BerandaScreen';
import LaporScreen from '../screens/citizen/LaporScreen';
import BayarScreen from '../screens/citizen/BayarScreen';
import ProfilScreen from '../screens/citizen/ProfilScreen';

const Tab = createBottomTabNavigator();

function withSafeArea(Component: React.ComponentType) {
  return function SafeAreaWrapper() {
    const insets = useSafeAreaInsets();
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Component />
      </View>
    );
  };
}

export default function CitizenTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1890ff',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen name="Beranda" component={withSafeArea(BerandaScreen)} />
      <Tab.Screen name="Lapor" component={withSafeArea(LaporScreen)} />
      <Tab.Screen name="Bayar" component={withSafeArea(BayarScreen)} />
      <Tab.Screen name="Profil" component={withSafeArea(ProfilScreen)} />
    </Tab.Navigator>
  );
}
