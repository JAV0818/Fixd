import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { Calendar, Clock, MapPin, Play, X, MessageCircle, Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { firestore, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { RepairOrder } from '@/types/orders';
import RequestCard from '@/components/provider/RequestCard';

// The Props should match the name of this screen in the navigator
type Props = NativeStackScreenProps<ProviderStackParamList, 'Requests'>;

export default function RequestsScreen({ navigation: stackNavigation }: Props) {
  const [requests, setRequests] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  // Fetch pending requests
  useEffect(() => {
    setLoading(true);
    setError(null);

    const ordersRef = collection(firestore, 'repairOrders');
    const q = query(
      ordersRef, 
      where('status', '==', 'Pending'), 
      where('providerId', '==', null), 
      orderBy('createdAt', 'desc') // Show newest first
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const fetchedRequests = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as RepairOrder));
        setRequests(fetchedRequests);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching requests:", err);
        setError("Failed to load requests. Please try again later.");
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

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

  // Loading State
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}> 
          <ActivityIndicator size="large" color="#00F0FF" />
          <Text style={styles.loadingText}>Loading Requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}> 
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If no requests after loading
  if (requests.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}> 
          <Text style={styles.sectionTitle}>SERVICE REQUESTS</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>NO PENDING REQUESTS</Text>
          <Text style={styles.emptySubtext}>New requests will appear here when available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main content with requests
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>PENDING SERVICE REQUESTS</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={requests}
        renderItem={({ item }) => <RequestCard item={item} navigation={stackNavigation} />}
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
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FF3D71',
    marginTop: 16,
  },
}); 