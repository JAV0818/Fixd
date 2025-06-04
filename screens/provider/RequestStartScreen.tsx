import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProviderStackParamList } from '../../navigation/ProviderNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle, Briefcase, User, LogOut, AlertCircle } from 'lucide-react-native';
import { firestore, auth } from '@/lib/firebase';
import { doc, updateDoc, increment, getDoc, Timestamp } from 'firebase/firestore';

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
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  licensePlate?: string;
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
      const orderRef = doc(firestore, 'repairOrders', orderId);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        let customerName = 'N/A';
        let customerAvatar = undefined;

        if (orderData.customerId) {
          const userRef = doc(firestore, 'users', orderData.customerId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            customerName = userData.displayName || 'Anonymous User';
            customerAvatar = userData.photoURL;
          }
        }
        
        let formattedDate = orderData.serviceDate;
        if (orderData.serviceDate instanceof Timestamp) {
          formattedDate = orderData.serviceDate.toDate().toLocaleDateString();
        }

        const fetchedDetails: OrderDetails = {
          id: orderId,
          customerName: customerName,
          customerAvatar: customerAvatar,
          serviceName: orderData.serviceName || orderData.items?.[0]?.name || 'Service details not available',
          date: formattedDate || 'Date not set',
          time: orderData.serviceTime || 'Time not set',
          address: orderData.serviceAddress || orderData.locationDetails?.address || 'Address not provided',
          status: orderData.status || 'Status Unknown',
          description: orderData.description || 'No description.',
          price: orderData.price ? `$${Number(orderData.price).toFixed(2)}` : 'Price not set',
          estimatedDuration: orderData.estimatedDuration || 'Not specified',
          customerId: orderData.customerId,
          vehicleMake: orderData.vehicleMake || orderData.vehicle?.make || 'N/A',
          vehicleModel: orderData.vehicleModel || orderData.vehicle?.model || 'N/A',
          vehicleYear: orderData.vehicleYear || orderData.vehicle?.year || 'N/A',
          licensePlate: orderData.licensePlate || orderData.vehicle?.licensePlate || 'N/A',
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
        const orderRef = doc(firestore, 'repairOrders', orderId);
        await updateDoc(orderRef, {
          status: 'InProgress',
          startedAt: new Date(),
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
      const orderRef = doc(firestore, 'repairOrders', orderId);
      await updateDoc(orderRef, {
        status: 'Completed',
        completedAt: new Date(),
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
      navigation.navigate('RepairOrders');

    } catch (error) {
      console.error("Error ending service:", error);
      Alert.alert("Error", "Could not end service. Please try again.");
    } finally {
      setIsActionButtonLoading(false);
    }
  };

  let buttonTextToDisplay = "Loading...";
  let buttonIconToDisplay: React.ReactNode = <ActivityIndicator size="small" color="#0A0F1E" />;
  let currentActionHandler = () => {};
  let isButtonDisabled = true;
  let headerTitleText = "Service Details";

  if (!initialLoading && requestDetails) {
    isButtonDisabled = isActionButtonLoading;
    currentActionHandler = handlePrimaryAction;

    if (serviceEnded || requestDetails.status === 'Completed') {
      buttonTextToDisplay = "SERVICE COMPLETED";
      buttonIconToDisplay = <CheckCircle size={20} color="#0A0F1E" />;
      isButtonDisabled = true;
      currentActionHandler = () => {};
      headerTitleText = "SERVICE COMPLETED";
    } else if (requestDetails.status === 'InProgress') {
      if (inspectionCompleted) {
        buttonTextToDisplay = "END SERVICE NOW";
        buttonIconToDisplay = <LogOut size={20} color="#0A0F1E" />;
        headerTitleText = "COMPLETE SERVICE";
      } else {
        buttonTextToDisplay = "PROCEED TO INSPECTION";
        buttonIconToDisplay = <CheckCircle size={20} color="#0A0F1E" />;
        headerTitleText = "SERVICE IN PROGRESS";
      }
    } else if (requestDetails.status === 'Accepted') {
      buttonTextToDisplay = "START SERVICE & INSPECTION";
      buttonIconToDisplay = <CheckCircle size={20} color="#0A0F1E" />;
      headerTitleText = "START SERVICE";
    } else {
      buttonTextToDisplay = requestDetails.status.toUpperCase();
      buttonIconToDisplay = <AlertCircle size={20} color="#0A0F1E" />;
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
        <ActivityIndicator size="large" color="#00F0FF" />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </SafeAreaView>
    );
  }

  if (!requestDetails) {
    return (
      <SafeAreaView style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
         <AlertCircle size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>Could not load service details.</Text>
        <TouchableOpacity onPress={fetchOrderAndCustomerDetails} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const displayStatus = serviceEnded ? "Completed" : (requestDetails.status === 'InProgress' ? "In Progress" : requestDetails.status);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitleText}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.customerCard}>
          <Image source={{ uri: requestDetails.customerAvatar || 'https://via.placeholder.com/150/0A0F1E/00F0FF?text=User' }} style={styles.avatar} />
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{requestDetails.customerName.toUpperCase()}</Text>
            <View style={styles.statusBadge(displayStatus)}>
                <Text style={styles.statusBadgeText}>{displayStatus.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <Briefcase size={20} color="#00F0FF" />
                <Text style={styles.sectionTitle}>SERVICE & VEHICLE</Text>
            </View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Service:</Text><Text style={styles.detailValue}>{requestDetails.serviceName}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Vehicle:</Text><Text style={styles.detailValue}>{`${requestDetails.vehicleMake} ${requestDetails.vehicleModel} (${requestDetails.vehicleYear})`}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Plate #:</Text><Text style={styles.detailValue}>{requestDetails.licensePlate}</Text></View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#00F0FF" />
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
            <User size={20} color="#00F0FF" />
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
            <TouchableOpacity 
            style={[
                styles.startButton,
                (isButtonDisabled || isActionButtonLoading) && styles.loadingButton, 
            ]}
            onPress={currentActionHandler}
            disabled={isButtonDisabled || isActionButtonLoading}
            >
            {isActionButtonLoading ? (
                <Text style={styles.buttonText}>{ (requestDetails.status === 'InProgress' && inspectionCompleted) ? "ENDING..." : "PROCESSING..." }</Text>
            ) : (
                <>
                {buttonIconToDisplay}
                <Text style={styles.buttonText}>{buttonTextToDisplay}</Text>
                </>
            )}
            </TouchableOpacity>
        </View>
      )}
      {(requestDetails.status === 'Completed') &&
         <View style={styles.footer}>
            <View style={[styles.startButton, styles.completedButton]}>
                <CheckCircle size={20} color="#0A0F1E" />
                <Text style={styles.buttonText}>SERVICE COMPLETED</Text>
            </View>
         </View>
      }

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  loadingText: {
    marginTop:10,
    fontSize: 16,
    color: '#7A89FF',
    fontFamily: 'Inter_500Medium',
  },
  errorText: {
    fontSize: 18,
    color: '#FF6B6B',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#00F0FF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#0A0F1E',
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
    borderBottomColor: '#2A3555',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#00F0FF',
    backgroundColor: '#2A3555'
  } as ImageStyle,
  customerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  statusBadge: (status: string): ViewStyle => ({
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    backgroundColor: 
      status === 'Completed' ? '#28A745' :
      status === 'InProgress' ? '#FFC107' :
      status === 'Accepted' ? '#00F0FF' :
      status === 'Pending' ? '#6C757D' :
      '#FD7E14',
  }),
  statusBadgeText: {
      fontSize: 10,
      fontFamily: 'Inter_700Bold',
      color: '#0A0F1E',
      letterSpacing: 0.5,
  } as TextStyle,
  priceText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
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
    color: '#7A89FF',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#00F0FF',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A3555',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00F0FF',
    borderRadius: 8,
    paddingVertical: 16,
  },
  loadingButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.5)',
  },
  completedButton: {
    backgroundColor: '#3D4A78',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0A0F1E',
    marginLeft: 8,
    letterSpacing: 1,
  },
}); 