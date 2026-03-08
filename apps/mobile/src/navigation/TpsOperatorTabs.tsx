import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import SampahMasukScreen from '../screens/tps-operator/SampahMasukScreen';
import SampahKeluarScreen from '../screens/tps-operator/SampahKeluarScreen';
import BankSampahScreen from '../screens/tps-operator/BankSampahScreen';
import StatusTpsScreen from '../screens/tps-operator/StatusTpsScreen';

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

export default function TpsOperatorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1890ff',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen name="Masuk" component={withSafeArea(SampahMasukScreen)} />
      <Tab.Screen name="Keluar" component={withSafeArea(SampahKeluarScreen)} />
      <Tab.Screen name="Bank Sampah" component={withSafeArea(BankSampahScreen)} />
      <Tab.Screen name="Status" component={withSafeArea(StatusTpsScreen)} />
    </Tab.Navigator>
  );
}
