import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import TerimaManifestScreen from '../screens/tpst-operator/TerimaManifestScreen';
import VerifikasiScreen from '../screens/tpst-operator/VerifikasiScreen';
import TpstProfilScreen from '../screens/tpst-operator/TpstProfilScreen';

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

export default function TpstOperatorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1890ff',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen name="Terima" component={withSafeArea(TerimaManifestScreen)} />
      <Tab.Screen name="Verifikasi" component={withSafeArea(VerifikasiScreen)} />
      <Tab.Screen name="Profil" component={withSafeArea(TpstProfilScreen)} />
    </Tab.Navigator>
  );
}
