import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Activity, Scale, TrendingUp } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: 'rgba(60, 60, 67, 0.1)',
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: -0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => (
            <Activity size={22} color={color} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: 'Log Food',
          tabBarIcon: ({ color }) => (
            <Scale size={22} color={color} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: 'Trends',
          tabBarIcon: ({ color }) => (
            <TrendingUp size={22} color={color} strokeWidth={1.75} />
          ),
        }}
      />
    </Tabs>
  );
}
