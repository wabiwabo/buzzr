import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();
const Placeholder = ({ title }: { title: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{title}</Text></View>
);

export default function DriverTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Jadwal" component={() => <Placeholder title="Jadwal" />} />
      <Tab.Screen name="Tracking" component={() => <Placeholder title="Tracking" />} />
      <Tab.Screen name="Checkpoint" component={() => <Placeholder title="Checkpoint" />} />
      <Tab.Screen name="Profil" component={() => <Placeholder title="Profil" />} />
    </Tab.Navigator>
  );
}
