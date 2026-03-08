import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import JadwalScreen from '../screens/driver/JadwalScreen';
import TrackingScreen from '../screens/driver/TrackingScreen';
import CheckpointScreen from '../screens/driver/CheckpointScreen';
import DriverProfilScreen from '../screens/driver/DriverProfilScreen';

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

export default function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1890ff',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen name="Jadwal" component={withSafeArea(JadwalScreen)} />
      <Tab.Screen name="Tracking" component={withSafeArea(TrackingScreen)} />
      <Tab.Screen name="Checkpoint" component={withSafeArea(CheckpointScreen)} />
      <Tab.Screen name="Profil" component={withSafeArea(DriverProfilScreen)} />
    </Tab.Navigator>
  );
}
