import React from 'react';
import { View, Text, Image } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Search, ListChecks, BellRing, CircleUser } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSignalsStore } from '../../src/store/signalsStore';
import { color as brandColor } from '../../src/theme/tokens';

function HomeHeaderTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image
        source={require('../../assets/icon.png')}
        style={{ width: 34, height: 34, borderRadius: 9 }}
      />
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 21, color: brandColor.ink }}>
        Lusha ToGo
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const TAB_H = 56;
  const unreadCount = useSignalsStore((s) => s.unreadCount);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: brandColor.brand,
        tabBarInactiveTintColor: brandColor.muted2,
        tabBarStyle: {
          backgroundColor: brandColor.surface,
          borderTopColor: brandColor.line,
          borderTopWidth: 1,
          height: TAB_H + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_600SemiBold',
        },
        headerStyle: { backgroundColor: brandColor.surface },
        headerTitleStyle: {
          fontFamily: 'Inter_700Bold',
          fontSize: 18,
          color: brandColor.ink,
        },
        headerTitleAlign: 'left',
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerTitle: () => <HomeHeaderTitle />,
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} color={color} strokeWidth={focused ? 2.25 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          headerTitle: 'Premium Search',
          tabBarIcon: ({ color, focused }) => (
            <Search size={22} color={color} strokeWidth={focused ? 2.25 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Lists',
          headerTitle: 'My Lists',
          tabBarIcon: ({ color, focused }) => (
            <ListChecks size={22} color={color} strokeWidth={focused ? 2.25 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="signals"
        options={{
          title: 'Signals',
          headerTitle: 'Signals',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <BellRing size={22} color={color} strokeWidth={focused ? 2.25 : 2} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  backgroundColor: brandColor.brand,
                  borderRadius: 7,
                  minWidth: 14,
                  height: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 2,
                }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          headerTitle: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <CircleUser size={22} color={color} strokeWidth={focused ? 2.25 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
