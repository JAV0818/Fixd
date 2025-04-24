import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Calendar, CircleCheck as CheckCircle2 } from 'lucide-react-native';
import ProgressBar from '../ui/ProgressBar';
import ServiceCard, { UpcomingService } from './ServiceCard';
import ServiceHistoryCard, { ServiceHistory } from './ServiceHistoryCard';

interface ScheduleDataProps {
  showLoading?: boolean; // For development testing
}

const ScheduleData: React.FC<ScheduleDataProps> = ({ 
  showLoading = false 
}) => {
  const [upcomingServices, setUpcomingServices] = useState<UpcomingService[]>([]);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const createMockData = useCallback(() => {
    // Mock upcoming services data
    const upcomingData: UpcomingService[] = [
      {
        id: '1',
        vehicleName: '2024 Tesla Model S',
        serviceType: 'Quantum Engine Calibration',
        date: 'March 15, 2025',
        time: '10:30 AM',
        status: 'confirmed',
        technician: 'Aaren Johnson',
        location: '123 Tech Ave, Boston MA',
      },
      {
        id: '2',
        vehicleName: '2024 Tesla Model S',
        serviceType: 'Battery Health Check',
        date: 'April 2, 2025',
        time: '2:00 PM',
        status: 'pending',
        technician: 'Sarah Chen',
        location: '123 Tech Ave, Boston MA',
      },
    ];

    // Mock service history data
    const historyData: ServiceHistory[] = [
      {
        id: '1',
        vehicleName: '2024 Tesla Model S',
        serviceType: 'Oil Change & Filter',
        date: 'February 1, 2025',
        technician: 'Michael Rodriguez',
        cost: '$89.99',
        status: 'completed',
      },
      {
        id: '2',
        vehicleName: '2024 Tesla Model S',
        serviceType: 'Brake Pad Replacement',
        date: 'January 15, 2025',
        technician: 'Emily Thompson',
        cost: '$299.99',
        status: 'completed',
      },
      {
        id: '3',
        vehicleName: '2024 Tesla Model S',
        serviceType: 'Tire Rotation',
        date: 'December 20, 2024',
        technician: 'Aaren Johnson',
        cost: '$79.99',
        status: 'completed',
      },
    ];

    return { upcomingData, historyData };
  }, []);

  // Simulate data fetching
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress(0);
    
    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const nextProgress = prev + 0.1;
        return nextProgress > 0.9 ? 0.9 : nextProgress;
      });
    }, 300);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get mock data
      const { upcomingData, historyData } = createMockData();
      
      // Update state
      setUpcomingServices(upcomingData);
      setServiceHistory(historyData);
      setLoadingProgress(1); // Complete
    } catch (error) {
      console.error("Error fetching service data:", error);
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  }, [createMockData]);

  // Initial data load
  useEffect(() => {
    if (showLoading) {
      fetchData();
    } else {
      // Skip loading for immediate display
      const { upcomingData, historyData } = createMockData();
      setUpcomingServices(upcomingData);
      setServiceHistory(historyData);
      setIsLoading(false);
    }
  }, [fetchData, createMockData, showLoading]);

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ProgressBar 
          progress={loadingProgress} 
          label="Loading service schedule" 
          showPercentage={false}
          height={6}
          animated={true}
        />
        <ActivityIndicator size="large" color="#00F0FF" style={styles.activityIndicator} />
        <Text style={styles.loadingText}>Loading your service schedule...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar size={20} color="#00F0FF" />
          <Text style={styles.sectionTitle}>UPCOMING SERVICES</Text>
        </View>
        
        {upcomingServices.length > 0 ? (
          upcomingServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))
        ) : (
          <Text style={styles.emptyStateText}>No upcoming services scheduled</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <CheckCircle2 size={20} color="#00F0FF" />
          <Text style={styles.sectionTitle}>SERVICE HISTORY</Text>
        </View>

        {serviceHistory.length > 0 ? (
          serviceHistory.map((service) => (
            <ServiceHistoryCard key={service.id} service={service} />
          ))
        ) : (
          <Text style={styles.emptyStateText}>No service history available</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  activityIndicator: {
    marginVertical: 20,
  },
  loadingText: {
    color: '#D0DFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  emptyStateText: {
    color: '#7A89FF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});

export default ScheduleData; 