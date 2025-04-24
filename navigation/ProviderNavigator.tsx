import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProviderDashboardScreen from '../screens/provider/ProviderDashboardScreen';
import ProviderProfileScreen from '../screens/provider/ProviderProfileScreen';
import RequestDetailScreen from '../screens/provider/RequestDetailScreen';
import RequestsScreen from '../screens/provider/RequestsScreen';
import RequestStartScreen from '../screens/provider/RequestStartScreen';
import RequestCancelScreen from '../screens/provider/RequestCancelScreen';
import RequestContactScreen from '../screens/provider/RequestContactScreen';

export type ProviderStackParamList = {
  ProviderDashboard: undefined;
  ProviderProfile: undefined;
  RequestDetail: { requestId: string };
  Requests: undefined;
  RequestStart: { requestId: string };
  RequestCancel: { requestId: string };
  RequestContact: { requestId: string };
};

const Stack = createNativeStackNavigator<ProviderStackParamList>();

export default function ProviderNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="ProviderDashboard"
      screenOptions={{
        headerShown: false, // Can customize header later if needed
      }}
    >
      <Stack.Screen name="ProviderDashboard" component={ProviderDashboardScreen} />
      <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
      <Stack.Screen name="Requests" component={RequestsScreen} />
      <Stack.Screen name="RequestStart" component={RequestStartScreen} />
      <Stack.Screen name="RequestCancel" component={RequestCancelScreen} />
      <Stack.Screen name="RequestContact" component={RequestContactScreen} />
    </Stack.Navigator>
  );
} 