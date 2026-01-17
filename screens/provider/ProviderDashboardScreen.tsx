import { View, Text, ScrollView, StyleSheet, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, DollarSign, PenTool as Tool, Users, Clock, ChevronRight, Activity } from 'lucide-react-native';
import { useState } from 'react';
import NotificationPanel from '../../components/NotificationPanel';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator'; // Adjust path if needed
import { RootStackParamList } from '@/navigation/AppNavigator'; // Root needed for screens outside tabs
import { ThemedButton } from '@/components/ui/ThemedButton';
import { Card } from 'react-native-paper';

const todayJobs = [
  {
    id: 1,
    customer: {
      name: 'Emily Rodriguez',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=60',
      rating: 4.8,
    },
    service: 'Quantum Engine Calibration',
    vehicle: '2024 Tesla Model S',
    time: '10:30 AM',
    status: 'upcoming',
    location: '123 Main St, San Francisco',
    urgency: 'high',
  },
  {
    id: 2,
    customer: {
      name: 'Michael Chen',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60',
      rating: 4.9,
    },
    service: 'Neural Brake System Sync',
    vehicle: '2023 BMW iX',
    time: '2:00 PM',
    status: 'confirmed',
    location: '456 Oak Ave, San Francisco',
    urgency: 'medium',
  },
];

const performanceMetrics = [
  {
    title: 'WEEKLY EARNINGS',
    value: '$1,250',
    change: '+15%',
    icon: DollarSign,
    color: '#00F0FF',
  },
  {
    title: 'SERVICES PROVIDED',
    value: '24',
    change: '+8%',
    icon: Tool,
    color: '#7A89FF',
  },
  {
    title: 'CLIENT INDEX',
    value: '18',
    change: '+12%',
    icon: Users,
    color: '#FF3D71',
  },
  {
    title: 'TOTAL HOURS',
    value: '156',
    change: '+5%',
    icon: Clock,
    color: '#00F0FF',
  },
];

export default function ProviderDashboardScreen() {
  const [showNotifications, setShowNotifications] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleServicePress = (serviceId: string) => {
    navigation.navigate('ServiceDetail', { id: serviceId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>QUANTUM NETWORK</Text>
            <Text style={styles.name}>TECHNICIAN AAREN</Text>
          </View>
          <Pressable 
            style={styles.iconButton}
            onPress={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={24} color="#00F0FF" />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>
        <View style={styles.statusBar}>
          <View style={styles.statusContent}>
            <Activity size={32} color="#00F0FF" />
            <Text style={styles.statusText}>WEEKLY DATA</Text>
            <Pressable onPress={() => console.log('View Details Pressed')}> 
              <Text style={styles.viewDetailsText}>View Details</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsGrid}>
          {performanceMetrics.map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <metric.icon size={20} color={metric.color} />
                <Text style={styles.metricTitle}>{metric.title}</Text>
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={[
                styles.metricChange,
                { color: metric.change.includes('+') ? '#00F0FF' : '#FF3D71' }
              ]}>
                {metric.change} this cycle
              </Text>
              <View style={[styles.metricLine, { backgroundColor: metric.color }]} />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MISSION QUEUE</Text>
            <Pressable style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
              <ChevronRight size={16} color="#00F0FF" />
            </Pressable>
          </View>

          {todayJobs.map((job) => (
            <Pressable key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={styles.customerInfo}>
                  <Image source={{ uri: job.customer.image }} style={styles.customerImage} />
                  <View>
                    <Text style={styles.customerName}>{job.customer.name.toUpperCase()}</Text>
                    <View style={styles.ratingContainer}>
                      <Activity size={12} color="#00F0FF" />
                      <Text style={styles.rating}>{job.customer.rating}</Text>
                    </View>
                  </View>
                </View>
                <View style={[
                  styles.urgencyBadge,
                  { backgroundColor: job.urgency === 'high' ? 'rgba(255, 61, 113, 0.2)' : 'rgba(0, 240, 255, 0.2)' }
                ]}>
                  <Text style={[
                    styles.urgencyText,
                    { color: job.urgency === 'high' ? '#FF3D71' : '#00F0FF' }
                  ]}>
                    {job.urgency.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.jobDetails}>
                <Text style={styles.serviceText}>{job.service}</Text>
                <Text style={styles.vehicleText}>{job.vehicle}</Text>
                <Text style={styles.locationText}>{job.location}</Text>
                <Text style={styles.timeText}>{job.time}</Text>
              </View>

              <View style={styles.jobActions}>
                <ThemedButton
                  variant="primary"
                  onPress={() => {}}
                  style={styles.actionButtonFlex}
                >
                  START
                </ThemedButton>
                <ThemedButton
                  variant="outlined"
                  onPress={() => {}}
                  style={styles.actionButtonFlex}
                >
                  CONTACT
                </ThemedButton>
              </View>

              <View style={styles.jobLine} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {showNotifications && (
        <NotificationPanel
          notifications={[
            {
              id: '1',
              title: 'QUANTUM ALERT',
              message: 'New high-priority service request detected',
              timestamp: '2 minutes ago',
              read: false,
            },
            {
              id: '2',
              title: 'SYSTEM UPDATE',
              message: 'Neural diagnostic matrix calibration complete',
              timestamp: '1 hour ago',
              read: false,
            },
            {
              id: '3',
              title: 'SCHEDULE SYNC',
              message: 'Tomorrow\'s mission parameters updated',
              timestamp: '3 hours ago',
              read: true,
            },
          ]}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={() => {}}
          onMarkAllAsRead={() => {}}
        />
      )}
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
    backgroundColor: 'rgba(10, 15, 30, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
    letterSpacing: 2,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3D71',
  },
  statusBar: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00F0FF',
    marginTop: 16,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 2,
    marginLeft: 12,
    flex: 1,
  },
  viewDetailsText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#00F0FF',
    textDecorationLine: 'underline',
  },
  content: {
    flex: 1,
  },
  metricsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    width: '47%',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
    position: 'relative',
    overflow: 'hidden',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A89FF',
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  metricLine: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 2,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#00F0FF',
  },
  jobCard: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
    position: 'relative',
    overflow: 'hidden',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#00F0FF',
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  urgencyText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  jobDetails: {
    marginBottom: 16,
  },
  serviceText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  vehicleText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#00F0FF',
  },
  actionButtonFlex: {
    flex: 1,
    marginHorizontal: 4,
  },
  jobActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00F0FF',
    overflow: 'hidden',
    position: 'relative',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 2,
    zIndex: 1,
  },
  secondaryButton: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderColor: '#7A89FF',
  },
  secondaryButtonText: {
    color: '#7A89FF',
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00F0FF',
    opacity: 0.15,
  },
  secondaryGlow: {
    backgroundColor: '#7A89FF',
  },
  jobLine: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 2,
    backgroundColor: '#00F0FF',
  },
});