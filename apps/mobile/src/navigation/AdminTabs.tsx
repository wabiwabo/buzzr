import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminInboxScreen from '../screens/admin/AdminInboxScreen';
import AdminLiveScreen from '../screens/admin/AdminLiveScreen';
import AdminProfilScreen from '../screens/admin/AdminProfilScreen';

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

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1890ff',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={withSafeArea(AdminDashboardScreen)} />
      <Tab.Screen name="Inbox" component={withSafeArea(AdminInboxScreen)} />
      <Tab.Screen name="Armada" component={withSafeArea(AdminLiveScreen)} />
      <Tab.Screen name="Profil" component={withSafeArea(AdminProfilScreen)} />
    </Tab.Navigator>
  );
}
