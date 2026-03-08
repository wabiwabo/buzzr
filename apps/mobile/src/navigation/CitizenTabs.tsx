import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();
const Placeholder = ({ title }: { title: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{title}</Text></View>
);

export default function CitizenTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Beranda" component={() => <Placeholder title="Beranda" />} />
      <Tab.Screen name="Lapor" component={() => <Placeholder title="Lapor" />} />
      <Tab.Screen name="Bayar" component={() => <Placeholder title="Bayar" />} />
      <Tab.Screen name="Profil" component={() => <Placeholder title="Profil" />} />
    </Tab.Navigator>
  );
}
