import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { Calendar, Clock, MapPin, Play, X, MessageCircle, Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';

// The Props should match the name of this screen in the navigator
type Props = NativeStackScreenProps<ProviderStackParamList, 'Requests'>;

// Mock data for service requests
const MOCK_REQUESTS = [
  {
    id: '1',
    customerName: 'John Smith',
    customerAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    service: 'Home Cleaning',
    date: 'May 15, 2023',
    time: '14:00 - 16:00',
    address: '123 Main St, Anytown',
    status: 'Pending',
  },
  {
    id: '2',
    customerName: 'Emily Johnson',
    customerAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    service: 'Lawn Mowing',
    date: 'May 16, 2023',
    time: '10:00 - 11:30',
    address: '456 Oak Ave, Anytown',
    status: 'Pending',
  },
  {
    id: '3',
    customerName: 'Michael Brown',
    customerAvatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    service: 'Furniture Assembly',
    date: 'May 17, 2023',
    time: '13:00 - 15:00',
    address: '789 Pine St, Anytown',
    status: 'Pending',
  },
];

export default function RequestsScreen({ navigation: stackNavigation }: Props) {
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const flatListRef = useRef<FlatList>(null);
  
  // Scroll to top when the screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      // This runs when the screen is focused
      
      return () => {
        // This runs when the screen is unfocused
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: false });
        }
      };
    }, [])
  );

  const renderRequestItem = ({ item }: { item: typeof MOCK_REQUESTS[0] }) => (
    <TouchableOpacity 
      style={styles.requestCard}
      onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.customerAvatar }} style={styles.avatar} />
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.customerName.toUpperCase()}</Text>
          <Text style={styles.serviceName}>{item.service}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Calendar size={16} color="#00F0FF" />
          <Text style={styles.infoText}>{item.date}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Clock size={16} color="#00F0FF" />
          <Text style={styles.infoText}>{item.time}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <MapPin size={16} color="#00F0FF" />
          <Text style={styles.infoText}>{item.address}</Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.startButton]}
          onPress={() => navigation.navigate('RequestStart', { requestId: item.id })}
        >
          <Check size={16} color="#0A0F1E" />
          <Text style={styles.startButtonText}>ACCEPT</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => navigation.navigate('RequestCancel', { requestId: item.id })}
        >
          <X size={16} color="#FF3D71" />
          <Text style={styles.cancelButtonText}>CANCEL</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.contactButton]}
          onPress={() => navigation.navigate('RequestContact', { requestId: item.id })}
        >
          <MessageCircle size={16} color="#7A89FF" />
          <Text style={styles.contactButtonText}>CONTACT</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardLine} />
    </TouchableOpacity>
  );

  // If no requests
  if (requests.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>NO SERVICE REQUESTS</Text>
          <Text style={styles.emptySubtext}>New requests will appear here</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>SERVICE REQUESTS</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentInset={{ bottom: 80 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  requestCard: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#00F0FF',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  serviceName: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  statusContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  cardContent: {
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
    paddingTop: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: '28%',
  },
  startButton: {
    backgroundColor: '#00F0FF',
    borderColor: '#00F0FF',
  },
  startButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#0A0F1E',
    marginLeft: 4,
    letterSpacing: 1,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    borderColor: '#FF3D71',
  },
  cancelButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#FF3D71',
    marginLeft: 4,
    letterSpacing: 1,
  },
  contactButton: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderColor: '#7A89FF',
  },
  contactButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
    marginLeft: 4,
    letterSpacing: 1,
  },
  cardLine: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 2,
    backgroundColor: '#00F0FF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 8,
    letterSpacing: 2,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
}); 