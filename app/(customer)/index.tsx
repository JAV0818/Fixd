import { View, Text, ScrollView, StyleSheet, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bell, Star, PenTool as Tool, Clock, MapPin, Zap, Car } from 'lucide-react-native';
import { useState } from 'react';
import NotificationPanel from '../../components/NotificationPanel';

const emergencyServices = [
  {
    id: 1,
    title: 'Battery Jump Start',
    image: 'https://images.unsplash.com/photo-1563483783356-1f12fb4a9b7c?w=800&auto=format&fit=crop&q=60',
    price: 'From $50',
    eta: '20-30 min',
  },
  {
    id: 2,
    title: 'Flat Tire Change',
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800&auto=format&fit=crop&q=60',
    price: 'From $45',
    eta: '15-25 min',
  },
  {
    id: 3,
    title: 'Fuel Delivery',
    image: 'https://images.unsplash.com/photo-1581781870027-04212e231e96?w=800&auto=format&fit=crop&q=60',
    price: 'From $40',
    eta: '25-35 min',
  },
];

const serviceCategories = [
  {
    title: 'Maintenance Services',
    services: [
      {
        id: 'oil-change',
        name: 'Oil Change Service',
        description: 'Complete oil & filter change with fluid check',
        image: 'https://images.unsplash.com/photo-1635764751197-0d0497aa1879?w=800&auto=format&fit=crop&q=60',
        price: 'From $40',
      },
      {
        id: 'tire-service',
        name: 'Tire Services',
        description: 'Rotation, balancing, repairs & replacement',
        image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800&auto=format&fit=crop&q=60',
        price: 'From $30',
      },
      {
        id: 'battery-service',
        name: 'Battery Services',
        description: 'Testing, replacement & terminal cleaning',
        image: 'https://images.unsplash.com/photo-1563483783356-1f12fb4a9b7c?w=800&auto=format&fit=crop&q=60',
        price: 'From $45',
      },
      {
        id: 'brake-inspection',
        name: 'Brake Inspection',
        description: 'Complete brake system inspection',
        image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=60',
        price: 'From $50',
      },
    ],
  },
  {
    title: 'Repair Services',
    services: [
      {
        id: 'brake-repair',
        name: 'Brake Repairs',
        description: 'Pad, rotor & caliper repairs',
        image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=60',
        price: 'From $150',
      },
      {
        id: 'engine-diagnostic',
        name: 'Engine Diagnostics',
        description: 'Check engine light & sensor diagnostics',
        image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop&q=60',
        price: 'From $80',
      },
      {
        id: 'cooling-system',
        name: 'Cooling System',
        description: 'Radiator & water pump repairs',
        image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&auto=format&fit=crop&q=60',
        price: 'From $200',
      },
      {
        id: 'suspension',
        name: 'Suspension & Steering',
        description: 'Shocks, struts & alignment',
        image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop&q=60',
        price: 'From $250',
      },
    ],
  },
  {
    title: 'Additional Services',
    services: [
      {
        id: 'fluid-service',
        name: 'Fluid Services',
        description: 'All fluid checks & top-offs',
        image: 'https://images.unsplash.com/photo-1635764751197-0d0497aa1879?w=800&auto=format&fit=crop&q=60',
        price: 'From $30',
      },
      {
        id: 'filter-replacement',
        name: 'Filter Replacements',
        description: 'Air & cabin filter replacement',
        image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop&q=60',
        price: 'From $25',
      },
      {
        id: 'electrical',
        name: 'Electrical Repairs',
        description: 'Lighting & electrical system repairs',
        image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&auto=format&fit=crop&q=60',
        price: 'From $60',
      },
      {
        id: 'exhaust',
        name: 'Exhaust System',
        description: 'Muffler & exhaust repairs',
        image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop&q=60',
        price: 'From $150',
      },
    ],
  },
];

export default function HomeScreen() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>WELCOME BACK</Text>
            <Text style={styles.name}>JULIAN</Text>
          </View>
          <Pressable 
            style={styles.iconButton}
            onPress={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={24} color="#00F0FF" />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>
        <Pressable style={styles.searchBar}>
          <Search size={20} color="#7A89FF" />
          <Text style={styles.searchText}>Search services...</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>EMERGENCY SERVICES</Text>
            <Zap size={20} color="#00F0FF" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesScroll}>
            {emergencyServices.map((service) => (
              <Pressable key={service.id} style={styles.emergencyCard}>
                <Image source={{ uri: service.image }} style={styles.serviceImage} />
                <View style={styles.cardOverlay} />
                <View style={styles.serviceContent}>
                  <Text style={styles.serviceTitle}>{service.title.toUpperCase()}</Text>
                  <View style={styles.serviceDetails}>
                    <View style={styles.detailItem}>
                      <Clock size={16} color="#00F0FF" />
                      <Text style={styles.detailText}>{service.eta}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.priceText}>{service.price}</Text>
                    </View>
                  </View>
                  <View style={styles.serviceLine} />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {serviceCategories.map((category, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{category.title}</Text>
              <Tool size={20} color="#00F0FF" />
            </View>
            <View style={styles.servicesGrid}>
              {category.services.map((service) => (
                <Pressable key={service.id} style={styles.serviceCard}>
                  <Image source={{ uri: service.image }} style={styles.serviceGridImage} />
                  <View style={styles.cardOverlay} />
                  <View style={styles.serviceGridContent}>
                    <Text style={styles.serviceGridTitle}>{service.name}</Text>
                    <Text style={styles.serviceGridDescription}>{service.description}</Text>
                    <Text style={styles.serviceGridPrice}>{service.price}</Text>
                    <View style={styles.serviceLine} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {showNotifications && (
        <NotificationPanel
          notifications={[
            {
              id: '1',
              title: 'TECHNICIAN EN ROUTE',
              message: 'Aaren is 10 minutes from your location',
              timestamp: '2 minutes ago',
              read: false,
            },
            {
              id: '2',
              title: 'SERVICE COMPLETE',
              message: 'Oil change service has been completed',
              timestamp: '1 hour ago',
              read: false,
            },
            {
              id: '3',
              title: 'APPOINTMENT REMINDER',
              message: 'Brake service scheduled for tomorrow at 2 PM',
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  searchText: {
    marginLeft: 8,
    color: '#7A89FF',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  servicesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  emergencyCard: {
    width: 280,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 15, 30, 0.7)',
  },
  serviceContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(10, 15, 30, 0.8)',
  },
  serviceTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  priceText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
  },
  serviceLine: {
    height: 2,
    width: 40,
    backgroundColor: '#00F0FF',
    marginTop: 8,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  serviceCard: {
    width: '47%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A3555',
    position: 'relative',
  },
  serviceGridImage: {
    width: '100%',
    height: '100%',
  },
  serviceGridContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(10, 15, 30, 0.8)',
  },
  serviceGridTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  serviceGridDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    marginBottom: 4,
  },
  serviceGridPrice: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#00F0FF',
  },
});