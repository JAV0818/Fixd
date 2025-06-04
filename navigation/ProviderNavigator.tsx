import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProviderDashboardScreen from '../screens/provider/ProviderDashboardScreen';
import ProviderProfileScreen from '../screens/provider/ProviderProfileScreen';
import RequestDetailScreen from '../screens/provider/RequestDetailScreen';
import RequestsScreen from '../screens/provider/RequestsScreen';
import RequestStartScreen from '../screens/provider/RequestStartScreen';
import RequestCancelScreen from '../screens/provider/RequestCancelScreen';
import RequestContactScreen from '../screens/provider/RequestContactScreen';
import UpdateStatusScreen from '../screens/provider/UpdateStatusScreen';
import PerformanceDetailsScreen from '../screens/provider/PerformanceDetailsScreen';
import AccountSettingsScreen from '../screens/provider/AccountSettingsScreen';
import InspectionChecklistScreen from '../screens/provider/InspectionChecklistScreen';
import CreateCustomChargeScreen from '../screens/provider/CreateCustomChargeScreen';

export type ProviderStackParamList = {
  ProviderDashboard: undefined;
  ProviderProfile: undefined;
  RequestDetail: { orderId: string };
  Requests: undefined;
  RequestStart: { orderId: string; inspectionCompleted?: boolean };
  RequestCancel: { orderId: string };
  RequestContact: { orderId: string };
  UpdateStatus: { orderId: string };
  InspectionChecklist: { orderId: string };
  PerformanceDetails: undefined;
  AccountSettings: undefined;
  CreateCustomCharge: undefined;
};

const Stack = createNativeStackNavigator<ProviderStackParamList>();

export default function ProviderNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Requests"
      screenOptions={{
        headerShown: false, // Can customize header later if needed
      }}
    >
      <Stack.Screen name="Requests" component={RequestsScreen} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
      <Stack.Screen name="RequestStart" component={RequestStartScreen} />
      <Stack.Screen name="RequestCancel" component={RequestCancelScreen} />
      <Stack.Screen name="RequestContact" component={RequestContactScreen} />
      <Stack.Screen name="UpdateStatus" component={UpdateStatusScreen} />
      <Stack.Screen name="InspectionChecklist" component={InspectionChecklistScreen} />
      <Stack.Screen name="CreateCustomCharge" component={CreateCustomChargeScreen} />
    </Stack.Navigator>
  );
} 