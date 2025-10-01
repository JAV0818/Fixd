import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { Calendar, Clock, MapPin, Play, X, MessageCircle, Check, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { firestore, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { RepairOrder } from '@/types/orders';
import RequestCard from '@/components/provider/RequestCard';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { globalStyles, colors, spacing, componentStyles } from '@/styles/theme';

// The Props should match the name of this screen in the navigator
type Props = NativeStackScreenProps<ProviderStackParamList, 'Requests'>;

export default function RequestsScreen({ navigation: stackNavigation }: Props) {
  const [requests, setRequests] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Fetch pending requests
  useEffect(() => {
    setLoading(true);
    setError(null);

    const ordersRef = collection(firestore, 'repairOrders');
    // Fetch pending requests; filter unassigned and sort client-side to avoid index/null issues
    const q = query(
      ordersRef,
      where('status', '==', 'Pending')
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const fetched = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as RepairOrder));
        // Only unassigned requests (no provider yet)
        const unassigned = fetched.filter(r => !(r as any).providerId);
        // Sort newest first by createdAt if available
        const sorted = unassigned.sort((a: any, b: any) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bDate - aDate;
        });
        setRequests(sorted);
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

  // Derived pagination values
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(requests.length / pageSize));
  }, [requests, pageSize]);

  const pagedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return requests.slice(start, end);
  }, [requests, currentPage, pageSize]);

  const goPrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const goNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  // Reset to first page when data size changes and currentPage is out of range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages]);

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
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.centeredContainer}> 
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={globalStyles.loadingText}>Loading Requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (error) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.centeredContainer}> 
          <Text style={globalStyles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If no requests after loading
  if (requests.length === 0) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.header}> 
          <Text style={globalStyles.sectionTitle}>SERVICE REQUESTS</Text>
          <TouchableOpacity 
            style={styles.addChargeButton}
            onPress={() => stackNavigation.navigate('CreateCustomCharge')}
          >
            <PlusCircle size={28} color={colors.accent} />
          </TouchableOpacity>
        </View>
        <View style={globalStyles.centeredContainer}>
          <Text style={globalStyles.emptyText}>NO PENDING REQUESTS</Text>
          <Text style={globalStyles.emptySubtext}>New requests will appear here when available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main content with requests
  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.sectionTitle}>PENDING SERVICE REQUESTS</Text>
        <View style={{ flexDirection: 'row' }}> 
          <TouchableOpacity 
            style={[styles.addChargeButton, { marginRight: 8 }]}
            onPress={async () => {
              try {
                const functionsInstance = getFunctions(auth.app);
                const callCreatePaymentIntent = httpsCallable(functionsInstance, 'createPaymentIntent');
                console.log('Calling createPaymentIntent function...');
                const result = await callCreatePaymentIntent({
                  testData: "hello from client - request screen",
                  amount: 1000,
                  currency: "usd",
                  customChargeId: "tempTestCharge001"
                });
                console.log("Cloud function call result:", result.data);
                const resultData = result.data as { status: string; stripeSecretKeyLoaded: boolean; receivedData: any };
                Alert.alert(
                  "Function Test Result", 
                  `Status: ${resultData.status}\nStripe Key Loaded: ${resultData.stripeSecretKeyLoaded}\nData Sent: ${JSON.stringify(resultData.receivedData)}`
                );
              } catch (error: any) {
                console.error("Cloud function call error:", error);
                Alert.alert("Function Call Error", error.message || "An unknown error occurred");
              }
            }}
          >
            <Text style={{color: colors.accent}}>Test PI</Text> 
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addChargeButton}
            onPress={() => stackNavigation.navigate('CreateCustomCharge')}
          >
            <PlusCircle size={28} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        ref={flatListRef}
        data={pagedRequests}
        renderItem={({ item }) => <RequestCard item={item} navigation={stackNavigation} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={globalStyles.listContainer}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentInset={{ bottom: 80 }}
        ListFooterComponent={
          <View style={globalStyles.listFooter}>
            <View style={styles.pagerRow}>
              <Pressable
                accessibilityLabel="Previous page"
                onPress={goPrev}
                disabled={currentPage === 1}
                style={({ pressed }) => [
                  componentStyles.tealIconButton,
                  pressed && componentStyles.tealButtonPressed,
                  currentPage === 1 && componentStyles.tealButtonDisabled,
                ]}
              >
                <ChevronLeft size={18} color={colors.accent} />
              </Pressable>
              <Text style={styles.pagerLabel}>Page {currentPage} of {totalPages}</Text>
              <Pressable
                accessibilityLabel="Next page"
                onPress={goNext}
                disabled={currentPage === totalPages}
                style={({ pressed }) => [
                  componentStyles.tealIconButton,
                  pressed && componentStyles.tealButtonPressed,
                  currentPage === totalPages && componentStyles.tealButtonDisabled,
                ]}
              >
                <ChevronRight size={18} color={colors.accent} />
              </Pressable>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addChargeButton: {
    padding: 8,
  },
  requestCard: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
  pagerButton: {},
  pagerPressed: {},
  pagerDisabled: {},
  pagerText: {},
  pagerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  pagerLabel: {
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
}); 