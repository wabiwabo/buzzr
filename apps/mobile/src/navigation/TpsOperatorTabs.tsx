import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();
const Placeholder = ({ title }: { title: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{title}</Text></View>
);

export default function TpsOperatorTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Masuk" component={() => <Placeholder title="Masuk" />} />
      <Tab.Screen name="Keluar" component={() => <Placeholder title="Keluar" />} />
      <Tab.Screen name="Bank Sampah" component={() => <Placeholder title="Bank Sampah" />} />
      <Tab.Screen name="Profil" component={() => <Placeholder title="Profil" />} />
    </Tab.Navigator>
  );
}
