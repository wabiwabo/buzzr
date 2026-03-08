import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();
const Placeholder = ({ title }: { title: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{title}</Text></View>
);

export default function CollectorTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Setor" component={() => <Placeholder title="Setor" />} />
      <Tab.Screen name="Dompet" component={() => <Placeholder title="Dompet" />} />
      <Tab.Screen name="Profil" component={() => <Placeholder title="Profil" />} />
    </Tab.Navigator>
  );
}
