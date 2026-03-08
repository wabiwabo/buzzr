import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BerandaScreen from '../screens/citizen/BerandaScreen';
import LaporScreen from '../screens/citizen/LaporScreen';
import BayarScreen from '../screens/citizen/BayarScreen';
import ProfilScreen from '../screens/citizen/ProfilScreen';

const Tab = createBottomTabNavigator();

export default function CitizenTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1890ff',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen name="Beranda" component={BerandaScreen} />
      <Tab.Screen name="Lapor" component={LaporScreen} />
      <Tab.Screen name="Bayar" component={BayarScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}
