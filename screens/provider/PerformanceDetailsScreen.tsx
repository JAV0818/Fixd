import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Award, Clock, Percent, ThumbsUp, CheckCircle, Activity as FeatherActivity } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { auth, firestore } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';

// Helper function to safely convert Firestore Timestamps or other date formats
const toDateSafe = (timestamp: any): Date => {
  if (!timestamp) return new Date(); 
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate(); 
  }
  if (timestamp.seconds && typeof timestamp.nanoseconds === 'number') {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000); 
  }
  if (timestamp instanceof Date) {
    return timestamp; 
  }
  const parsedDate = new Date(timestamp);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  return new Date(); 
};

interface ProviderProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  profilePictureUrl?: string;
  yearsOfExperience?: number;
  numberOfJobsCompleted?: number;
  averageRating?: number;
  createdAt?: Timestamp;
  numberOfAcceptedJobs?: number; // For Completion Rate
  onTimeArrivals?: number;      // For On-Time Arrival Rate
  totalTrackedArrivals?: number; // For On-Time Arrival Rate
  // Add other fields as needed for other metrics like response rate, etc.
}

type PerformanceMetric = {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  color: string;
};

const PerformanceDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [providerData, setProviderData] = useState<ProviderProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviderData = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setProviderData(userDoc.data() as ProviderProfileData);
          } else {
            console.error("No such user document for provider!");
            setProviderData(null);
          }
        } catch (error) {
          console.error("Error fetching provider data:", error);
          setProviderData(null);
        }
      }
      setLoading(false);
    };

    fetchProviderData();
  }, []);

  const overallRating = providerData?.averageRating ? providerData.averageRating.toFixed(1) : 'N/A';
  
  let completionRate = 'N/A';
  if (providerData?.numberOfAcceptedJobs && providerData.numberOfAcceptedJobs > 0 && providerData.numberOfJobsCompleted !== undefined) {
    const rate = (providerData.numberOfJobsCompleted / providerData.numberOfAcceptedJobs) * 100;
    completionRate = rate.toFixed(0) + '%';
  }

  // Placeholder for On-Time Arrival - will be N/A until logic is defined
  // Based on user feedback, we might calculate this using acceptedAt vs startedAt from repairOrders,
  // or use onTimeArrivals/totalTrackedArrivals if these are populated elsewhere.
  let onTimeArrivalRateDisplay = 'N/A'; 
  // Example if using onTimeArrivals fields:
  // if (providerData?.totalTrackedArrivals && providerData.totalTrackedArrivals > 0 && providerData.onTimeArrivals !== undefined) {
  //   const rate = (providerData.onTimeArrivals / providerData.totalTrackedArrivals) * 100;
  //   onTimeArrivalRateDisplay = rate.toFixed(0) + '%';
  // }


  const metrics: PerformanceMetric[] = [
    {
      title: 'Overall Rating',
      value: overallRating,
      icon: <Star size={24} color="#FFD700" />,
      description: 'Average customer rating based on completed services',
      color: '#FFD700'
    },
    {
      title: 'Completion Rate',
      value: completionRate,
      icon: <CheckCircle size={24} color="#3F51B5" />, // Using CheckCircle for completion
      description: 'Percentage of accepted services that you complete successfully',
      color: '#3F51B5'
    },
    {
      title: 'On-time Arrival',
      value: onTimeArrivalRateDisplay, // Will be 'N/A' for now
      icon: <FeatherActivity size={24} color="#FF9800" />, // Using Activity for on-time
      description: 'Percentage of services where you arrived by the expected time', // Description updated
      color: '#FF9800'
    }
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#00F0FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PERFORMANCE METRICS</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingStateContainer}>
          <ActivityIndicator size="large" color="#00F0FF" />
          <Text style={styles.loadingText}>Loading Performance Data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PERFORMANCE METRICS</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Performance Overview</Text>
          <Text style={styles.overviewDescription}>
            Your performance metrics help you understand how customers perceive your service quality. 
            Higher ratings can lead to more service requests and better opportunities.
          </Text>
        </View>
        
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${metric.color}20` }]}>
                {metric.icon}
              </View>
              <View style={styles.metricTitleContainer}>
                <Text style={styles.metricTitle}>{metric.title.toUpperCase()}</Text>
                <Text style={[styles.metricValue, { color: metric.color }]}>{metric.value}</Text>
              </View>
            </View>
            <Text style={styles.metricDescription}>{metric.description}</Text>
            <View style={[styles.metricLine, { backgroundColor: metric.color }]} />
          </View>
        ))}
        
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>TIPS TO IMPROVE</Text>
          <Text style={styles.tipItem}>• Respond quickly to new service requests</Text>
          <Text style={styles.tipItem}>• Arrive on time for scheduled services</Text>
          <Text style={styles.tipItem}>• Communicate clearly with customers</Text>
          <Text style={styles.tipItem}>• Complete services thoroughly and professionally</Text>
          <Text style={styles.tipItem}>• Follow up with customers after service completion</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(10, 15, 30, 0.9)',
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
  overviewCard: {
    backgroundColor: 'rgba(26, 33, 56, 1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  overviewDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  metricCard: {
    backgroundColor: 'rgba(26, 33, 56, 1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricTitleContainer: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },
  metricDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    lineHeight: 20,
    marginTop: 8,
    opacity: 0.8,
  },
  metricLine: {
    height: 2,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  tipsCard: {
    backgroundColor: 'rgba(26, 33, 56, 1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipsTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 12,
    letterSpacing: 1,
  },
  tipItem: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 6,
    opacity: 0.9,
  },
  loadingStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0F1E',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#00F0FF',
    fontFamily: 'Inter_500Medium',
  },
});

export default PerformanceDetailsScreen; 