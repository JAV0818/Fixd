import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users, TrendingUp, Star, Download } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const clientData = [
  {
    id: 1,
    name: 'Emily Rodriguez',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=60',
    services: 5,
    rating: 4.8,
    lastService: '2 days ago',
  },
  {
    id: 2,
    name: 'Michael Chen',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60',
    services: 3,
    rating: 4.9,
    lastService: '1 week ago',
  },
  {
    id: 3,
    name: 'Sarah Thompson',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=60',
    services: 4,
    rating: 5.0,
    lastService: '3 days ago',
  },
];

export default function ClientsScreen() {
  const router = useRouter();
  const totalClients = clientData.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </Pressable>
        <Text style={styles.title}>CLIENT INDEX</Text>
        <Pressable style={styles.exportButton}>
          <Download size={20} color="#00F0FF" />
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Users size={24} color="#00F0FF" />
            <Text style={styles.summaryTitle}>Total Clients</Text>
          </View>
          <Text style={styles.summaryAmount}>{totalClients}</Text>
          <View style={styles.summaryFooter}>
            <TrendingUp size={16} color="#00F0FF" />
            <Text style={styles.summaryTrend}>+12% from last month</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg. Rating</Text>
            <Text style={styles.statValue}>4.9</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Retention Rate</Text>
            <Text style={styles.statValue}>85%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>New Clients</Text>
            <Text style={styles.statValue}>+5</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Referrals</Text>
            <Text style={styles.statValue}>3</Text>
          </View>
        </View>

        <View style={styles.clientsSection}>
          <Text style={styles.sectionTitle}>Recent Clients</Text>
          {clientData.map((client) => (
            <View key={client.id} style={styles.clientCard}>
              <View style={styles.clientHeader}>
                <Image source={{ uri: client.image }} style={styles.clientImage} />
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{client.name}</Text>
                  <View style={styles.ratingContainer}>
                    <Star size={16} color="#FFB800" fill="#FFB800" />
                    <Text style={styles.ratingText}>{client.rating}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.clientStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statItemLabel}>Services</Text>
                  <Text style={styles.statItemValue}>{client.services}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statItemLabel}>Last Service</Text>
                  <Text style={styles.statItemValue}>{client.lastService}</Text>
                </View>
              </View>
              <View style={styles.clientProgress}>
                <View 
                  style={[
                    styles.progressBar,
                    { width: `${(client.services / 5) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Client Insights</Text>
          <View style={styles.insightCard}>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Repeat Customers</Text>
              <Text style={styles.insightValue}>75%</Text>
              <View style={[styles.insightBar, { width: '75%' }]} />
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Service Satisfaction</Text>
              <Text style={styles.insightValue}>92%</Text>
              <View style={[styles.insightBar, { width: '92%' }]} />
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Referral Rate</Text>
              <Text style={styles.insightValue}>45%</Text>
              <View style={[styles.insightBar, { width: '45%' }]} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(10, 15, 30, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginLeft: 8,
  },
  summaryAmount: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 12,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryTrend: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#00F0FF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
  },
  clientsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 16,
  },
  clientCard: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#FFB800',
  },
  clientStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statItemLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 4,
  },
  statItemValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
  },
  clientProgress: {
    height: 4,
    backgroundColor: 'rgba(122, 137, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00F0FF',
  },
  insightsSection: {
    marginBottom: 24,
  },
  insightCard: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  insightItem: {
    marginBottom: 16,
  },
  insightLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 8,
  },
  insightValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 8,
  },
  insightBar: {
    height: 4,
    backgroundColor: '#00F0FF',
    borderRadius: 2,
  },
});