import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { colors, globalStyles, componentStyles } from '@/styles/theme';
import { RepairOrder } from '@/types/orders';
import RequestCard from '@/components/provider/RequestCard';
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

export default function QuoteMarketplaceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Tab bar height (from CustomTabBar: 85px total)
  const TAB_BAR_HEIGHT = 85;
  
  // Fetch pending requests
  const fetchRequests = () => {
    const ordersRef = collection(firestore, 'repair-orders');
    // Fetch pending requests; filter unassigned and sort client-side to avoid index/null issues
    const q = query(
      ordersRef,
      where('status', '==', 'Pending')
    );

    return onSnapshot(q, 
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
        setRefreshing(false);
      },
      (err) => {
        console.error("Error fetching requests:", err);
        setError("Failed to load requests. Please try again later.");
        setLoading(false);
        setRefreshing(false);
      }
    );
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = fetchRequests();
    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1); // Reset to first page on refresh
    // The onSnapshot listener will automatically update the data
    // We just need to wait a moment for it to sync
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

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

  // Loading State
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}> 
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}> 
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
          <Text style={styles.title}>Requests</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateCustomCharge' as never)}
          >
            <PlusCircle size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
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
        <Text style={styles.title}>Requests</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateCustomCharge' as never)}
        >
          <PlusCircle size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        ref={flatListRef}
        data={pagedRequests}
        renderItem={({ item }) => <RequestCard item={item} navigation={navigation as any} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentInset={{ bottom: TAB_BAR_HEIGHT }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={20}
          />
        }
        ListFooterComponent={
          <View style={styles.paginationContainer}>
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
                <ChevronLeft size={18} color={currentPage === 1 ? colors.textLight : colors.primary} />
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
                <ChevronRight size={18} color={currentPage === totalPages ? colors.textLight : colors.primary} />
              </Pressable>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: { 
    color: colors.textPrimary, 
    fontFamily: 'Inter_700Bold', 
    fontSize: 22 
  },
  addButton: {
    padding: 8,
  },
  loadingText: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 12,
  },
  errorText: {
    color: colors.danger,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  emptyText: {
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.textTertiary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 105, // TAB_BAR_HEIGHT (85) + extra padding (20)
    flexGrow: 1,
  },
  paginationContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
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


