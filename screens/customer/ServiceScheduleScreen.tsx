import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, SectionList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock, Wrench, AlertTriangle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { auth, firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, getDoc, doc } from 'firebase/firestore';
import OrderCard from '@/components/orders/OrderCard';
import { Order as DisplayableOrder } from '@/components/orders/OrderCard';
import { colors } from '@/styles/theme';

interface OrderSection {
  title: string;
  data: DisplayableOrder[];
}

export default function ServiceScheduleScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sections, setSections] = useState<OrderSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const processAndSetSections = (orders: DisplayableOrder[]) => {
    const upcoming: DisplayableOrder[] = [];
    const past: DisplayableOrder[] = [];

    orders.forEach(order => {
      if (['Accepted', 'Scheduled', 'In Progress', 'InProgress', 'Waiting'].includes(order.status)) {
        upcoming.push(order);
      } else if (['Completed', 'Cancelled', 'Denied', 'Pending'].includes(order.status)) {
        past.push(order);
      }
    });
    
    const newSections: OrderSection[] = [];
    if (upcoming.length > 0) {
      newSections.push({ title: 'Upcoming/Active Services', data: upcoming });
    }
    if (past.length > 0) {
      newSections.push({ title: 'Past Services', data: past });
    }

    setSections(newSections);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchOrders = () => {
    const user = auth.currentUser;
    if (!user) {
      setError("Please log in to view your schedule.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    setError(null);

    const repairOrdersRef = collection(firestore, 'repairOrders');
    const repairOrdersQuery = query(
      repairOrdersRef,
      where('customerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(repairOrdersQuery, async (snapshot) => {
      const fetchedOrders = snapshot.docs.map((docSnapshot) => {
        const orderData = docSnapshot.data() as Omit<DisplayableOrder, 'id'>;
        return { 
          ...orderData, 
          id: docSnapshot.id,
        } as DisplayableOrder;
      });

      processAndSetSections(fetchedOrders);

    }, (err) => {
      console.error("Error fetching orders:", err);
      setError("Failed to load your service schedule. Please try again.");
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = fetchOrders();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };
  
  const handleOrderPress = (orderId: string) => {
    navigation.navigate('OrderDetail', { orderId });
  };

  const handleChatPress = (orderId: string, providerName?: string | null | undefined) => {
    console.log("Chat pressed for order:", orderId, "Provider:", providerName);
    Alert.alert("Chat Feature", `Chat for order ${orderId} with ${providerName || 'provider'} is not yet implemented.`);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.title}>Service Schedule</Text>
        </View>
        <View style={styles.centeredMessageContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Your Schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.title}>Service Schedule</Text>
        </View>
        <View style={styles.centeredMessageContainer}>
          <AlertTriangle size={40} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.title}>Service Schedule</Text>
      </View>
      
      {sections.length === 0 && !loading ? (
        <View style={styles.centeredMessageContainer}>
          <Calendar size={40} color={colors.textTertiary} />
          <Text style={styles.emptyMessageText}>You have no scheduled services or past orders.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OrderCard order={item} onViewDetails={() => handleOrderPress(item.id)} onChatPress={() => handleChatPress(item.id, item.providerName)} />}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary}/>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    flex: 1,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textTertiary,
    fontFamily: 'Inter_500Medium',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.danger,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyMessageText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textTertiary,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    paddingVertical: 12,
    paddingTop: 20,
    backgroundColor: colors.background,
  },
}); 