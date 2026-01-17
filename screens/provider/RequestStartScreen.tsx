import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, ViewStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle, Briefcase, User, LogOut, AlertCircle } from 'lucide-react-native';
import { firestore, auth } from '@/lib/firebase';
import { doc, updateDoc, increment, getDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { colors } from '@/styles/theme';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { Card } from 'react-native-paper';

type Props = NativeStackScreenProps<ProviderStackParamList, 'RequestStart'>;

interface OrderDetails {
  id: string;
  customerName: string;
  customerAvatar?: string;
  serviceName: string;
  date: string;
  time: string;
  address: string;
  status: string;
  description: string;
  price?: string;
  estimatedDuration?: string;
  customerId: string;
  vehicleDisplay: string;
}

export default function RequestStartScreen({ navigation, route }: Props) {
  const { orderId, inspectionCompleted } = route.params;
  const [initialLoading, setInitialLoading] = useState(true);
  const [serviceEnded, setServiceEnded] = useState(false);
  const [isActionButtonLoading, setIsActionButtonLoading] = useState(false);
  
  const [requestDetails, setRequestDetails] = useState<OrderDetails | null>(null);

  const fetchOrderAndCustomerDetails = useCallback(async () => {
    setInitialLoading(true);
    try {
      const orderRef = doc(firestore, 'repair-orders', orderId);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        let customerName = 'Anonymous User';
        let customerAvatar = undefined;

        if (orderData.customerId) {
          const userRef = doc(firestore, 'users', orderData.customerId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.firstName && userData.lastName) {
              customerName = `${userData.firstName} ${userData.lastName}`;
            } else if (userData.displayName) {
              customerName = userData.displayName;
            } else if (orderData.customerName) {
              customerName = orderData.customerName;
            }
            customerAvatar = userData.photoURL;
          } else if (orderData.customerName) {
            customerName = orderData.customerName;
          }
        } else if (orderData.customerName) {
          customerName = orderData.customerName;
        }
        
        let scheduleDate: Date | null = null;
        if (orderData.startedAt && typeof orderData.startedAt.toDate === 'function') {
            scheduleDate = orderData.startedAt.toDate();
        } else if (orderData.acceptedAt && typeof orderData.acceptedAt.toDate === 'function') {
            scheduleDate = orderData.acceptedAt.toDate();
        } else if (orderData.createdAt && typeof orderData.createdAt.toDate === 'function') {
            scheduleDate = orderData.createdAt.toDate();
        }

        const formattedDate = scheduleDate ? scheduleDate.toLocaleDateString() : 'Date not set';
        const formattedTime = scheduleDate ? scheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time not set';

        const location = orderData.locationDetails;
        const fullAddress = location 
          ? `${location.address || ''}, ${location.city || ''}, ${location.state || ''} ${location.zipCode || ''}`.replace(/, ,/g, ',').trim().replace(/^,|,$/g, '')
          : 'Address not provided';

        const fetchedDetails: OrderDetails = {
          id: orderId,
          customerName: customerName,
          customerAvatar: customerAvatar,
          serviceName: orderData.items?.[0]?.name || 'Service details not available',
          date: formattedDate,
          time: formattedTime,
          address: fullAddress,
          status: orderData.status || 'Status Unknown',
          description: orderData.locationDetails?.additionalNotes || 'No additional notes provided.',
          price: orderData.totalPrice ? `$${Number(orderData.totalPrice).toFixed(2)}` : 'Price not set',
          estimatedDuration: 'Not specified',
          customerId: orderData.customerId,
          vehicleDisplay: orderData.items?.[0]?.vehicleDisplay || 'N/A',
        };
        setRequestDetails(fetchedDetails);

        if (fetchedDetails.status === 'Completed') {
          setServiceEnded(true);
        }
      } else {
        console.error("No such order document!");
        Alert.alert("Error", "Could not find order details.");
        setRequestDetails(null);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      Alert.alert("Error", "Failed to load order details. Please try again.");
      setRequestDetails(null);
    } finally {
      setInitialLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderAndCustomerDetails();
  }, [fetchOrderAndCustomerDetails]);

  useEffect(() => {
    if (inspectionCompleted && requestDetails?.status === 'InProgress') {
    }
  }, [inspectionCompleted, requestDetails?.status]);

  const handlePrimaryAction = async () => {
    if (!requestDetails) return;
    setIsActionButtonLoading(true);

    try {
      if (requestDetails.status === 'Accepted') {
        const orderRef = doc(firestore, 'repair-orders', orderId);
        await updateDoc(orderRef, {
          status: 'InProgress',
          startedAt: serverTimestamp(),
        });
        setRequestDetails(prev => prev ? { ...prev, status: 'InProgress' } : null);
        navigation.navigate('InspectionChecklist', { orderId });
      } else if (requestDetails.status === 'InProgress') {
        if (inspectionCompleted) {
          await handleEndService();
        } else {
          navigation.navigate('InspectionChecklist', { orderId });
        }
      }
    } catch (error) {
      console.error("Error in primary action:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      if (requestDetails.status !== 'InProgress' || !inspectionCompleted) {
         setIsActionButtonLoading(false);
      }
    }
  };

  const handleEndService = async () => {
    if (!auth.currentUser || !requestDetails) {
      Alert.alert("Error", "Authentication required or order details missing.");
      return;
    }
    setIsActionButtonLoading(true);
    try {
      const orderRef = doc(firestore, 'repair-orders', orderId);
      await updateDoc(orderRef, {
        status: 'Completed',
        completedAt: serverTimestamp(),
      });

      const providerRef = doc(firestore, 'users', auth.currentUser.uid);
      await updateDoc(providerRef, {
        numberOfJobsCompleted: increment(1),
      });
      
      console.log(`TODO: Send push notification to customer ${requestDetails.customerId} to rate the service for order ${orderId}`);
      Alert.alert(
        "Service Ended", 
        "The service has been marked as completed. The customer will be notified to rate the service."
      );
      setServiceEnded(true);
      setRequestDetails(prev => prev ? { ...prev, status: 'Completed' } : null);
      navigation.navigate('Requests');

    } catch (error) {
      console.error("Error ending service:", error);
      Alert.alert("Error", "Could not end service. Please try again.");
    } finally {
      setIsActionButtonLoading(false);
    }
  };

  let buttonTextToDisplay = "Loading...";
  let buttonIconToDisplay: React.ReactNode = <ActivityIndicator size="small" color={colors.primary} />;
  let currentActionHandler = () => {};
  let isButtonDisabled = true;
  let headerTitleText = "Service Details";

  if (!initialLoading && requestDetails) {
    isButtonDisabled = isActionButtonLoading;
    currentActionHandler = handlePrimaryAction;

    if (serviceEnded || requestDetails.status === 'Completed') {
      buttonTextToDisplay = "SERVICE COMPLETED";
      buttonIconToDisplay = <CheckCircle size={20} color={colors.surface} />;
      isButtonDisabled = true;
      currentActionHandler = () => {};
      headerTitleText = "SERVICE COMPLETED";
    } else if (requestDetails.status === 'InProgress') {
      if (inspectionCompleted) {
        buttonTextToDisplay = "END SERVICE NOW";
        buttonIconToDisplay = <LogOut size={20} color={colors.surface} />;
        headerTitleText = "COMPLETE SERVICE";
      } else {
        buttonTextToDisplay = "PROCEED TO INSPECTION";
        buttonIconToDisplay = <CheckCircle size={20} color={colors.surface} />;
        headerTitleText = "SERVICE IN PROGRESS";
      }
    } else if (requestDetails.status === 'Accepted') {
      buttonTextToDisplay = "START SERVICE & INSPECTION";
      buttonIconToDisplay = <CheckCircle size={20} color={colors.surface} />;
      headerTitleText = "START SERVICE";
    } else {
      buttonTextToDisplay = requestDetails.status.toUpperCase();
      buttonIconToDisplay = <AlertCircle size={20} color={colors.surface} />;
      isButtonDisabled = true;
      currentActionHandler = () => {};
      headerTitleText = `SERVICE ${requestDetails.status.toUpperCase()}`;
    }
    if(isActionButtonLoading){
        if(requestDetails.status === 'InProgress' && inspectionCompleted) {
            buttonTextToDisplay = "ENDING..."
        } else {
            buttonTextToDisplay = "PROCESSING..."
        }
    }
  }

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </SafeAreaView>
    );
  }

  if (!requestDetails) {
    return (
      <SafeAreaView style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
         <AlertCircle size={48} color={colors.danger} />
        <Text style={styles.errorText}>Could not load service details.</Text>
        <TouchableOpacity onPress={fetchOrderAndCustomerDetails} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const displayStatus = serviceEnded ? "Completed" : (requestDetails.status === 'InProgress' ? "In Progress" : requestDetails.status);
  
  const getStatusBadgeStyle = (status: string): ViewStyle => ({
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    backgroundColor: 
      status === 'Completed' ? colors.successLight :
      status === 'InProgress' ? colors.warningLight :
      status === 'Accepted' ? colors.primaryLight :
      status === 'Pending' ? colors.surfaceAlt :
      colors.warningLight,
  });

  const getStatusBadgeTextColor = (status: string): string => {
    return status === 'Completed' ? colors.success :
           status === 'InProgress' ? colors.warning :
           status === 'Accepted' ? colors.primary :
           status === 'Pending' ? colors.textSecondary :
           colors.warning;
  };
  
  const statusBadgeStyle = getStatusBadgeStyle(displayStatus);
  const statusBadgeTextColor = getStatusBadgeTextColor(displayStatus);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitleText}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.customerCard}>
          <Image source={{ uri: requestDetails.customerAvatar || 'https://via.placeholder.com/150/0A0F1E/00F0FF?text=User' }} style={styles.avatar} />
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{requestDetails.customerName.toUpperCase()}</Text>
            <View style={statusBadgeStyle}>
                <Text style={[styles.statusBadgeText, { color: statusBadgeTextColor }]}>{displayStatus.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Briefcase size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>SERVICE & VEHICLE</Text>
            </View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Service:</Text><Text style={styles.detailValue}>{requestDetails.serviceName}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Vehicle:</Text><Text style={styles.detailValue}>{requestDetails.vehicleDisplay}</Text></View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>SCHEDULE & LOCATION</Text>
          </View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Date:</Text><Text style={styles.detailValue}>{requestDetails.date}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Time:</Text><Text style={styles.detailValue}>{requestDetails.time}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Address:</Text><Text style={styles.detailValue}>{requestDetails.address}</Text></View>
          {requestDetails.estimatedDuration && <View style={styles.detailRow}><Text style={styles.detailLabel}>Duration:</Text><Text style={styles.detailValue}>{requestDetails.estimatedDuration}</Text></View>}
        </View>

        {requestDetails.price && 
            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, {marginLeft: 0}]}>Quoted Price</Text>
                </View>
                <Text style={styles.priceText}>{requestDetails.price}</Text>
            </View>
        }
        
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <User size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>CLIENT INSTRUCTIONS</Text>
          </View>
          <Text style={styles.descriptionText}>{requestDetails.description}</Text>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            { (serviceEnded || requestDetails.status === 'Completed') ? "This service has been marked as completed." :
            requestDetails.status === 'InProgress' ? (inspectionCompleted ? "Press 'End Service Now' to finalize." : "Service is In Progress. Proceed to vehicle inspection.") :
            requestDetails.status === 'Accepted' ? "Press 'Start Service & Inspection' to begin work." :
            `Service status: ${requestDetails.status}`}
          </Text>
        </View>
      </ScrollView>
      
      {(requestDetails.status !== 'Cancelled' && requestDetails.status !== 'Pending' && requestDetails.status !== 'Completed') && (
        <View style={styles.footer}>
            <ThemedButton
              variant="primary"
              onPress={currentActionHandler}
              disabled={isButtonDisabled || isActionButtonLoading}
              loading={isActionButtonLoading}
              style={styles.startButton}
            >
              {isActionButtonLoading 
                ? (requestDetails.status === 'InProgress' && inspectionCompleted) ? "ENDING..." : "PROCESSING..."
                : buttonTextToDisplay}
            </ThemedButton>
        </View>
      )}
      {(requestDetails.status === 'Completed') &&
         <View style={styles.footer}>
            <ThemedButton
              variant="secondary"
              disabled
              icon="check-circle"
              style={styles.startButton}
            >
              SERVICE COMPLETED
            </ThemedButton>
         </View>
      }

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop:10,
    fontSize: 16,
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
  },
  errorText: {
    fontSize: 18,
    color: colors.danger,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt
  },
  customerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  statusBadgeText: {
      fontSize: 10,
      fontFamily: 'Inter_700Bold',
      letterSpacing: 0.5,
  },
  priceText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
    marginLeft: 8,
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
  },
  loadingButton: {
    backgroundColor: colors.primaryLight,
    opacity: 0.7,
  },
  completedButton: {
    backgroundColor: colors.surfaceAlt,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.surface,
    marginLeft: 8,
    letterSpacing: 1,
  },
}); 