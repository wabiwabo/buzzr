import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import TugasScreen from '../screens/sweeper/TugasScreen';
import AbsensiScreen from '../screens/sweeper/AbsensiScreen';
import SweeperProfilScreen from '../screens/sweeper/SweeperProfilScreen';

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

export default function SweeperTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1890ff',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen name="Tugas" component={withSafeArea(TugasScreen)} />
      <Tab.Screen name="Absensi" component={withSafeArea(AbsensiScreen)} />
      <Tab.Screen name="Profil" component={withSafeArea(SweeperProfilScreen)} />
    </Tab.Navigator>
  );
}
