import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, PenTool as Tool, TrendingUp, Activity, Download } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const serviceCategories = [
  { name: 'Engine Repair', count: 8, growth: 15 },
  { name: 'Brake Service', count: 6, growth: 10 },
  { name: 'Oil Change', count: 5, growth: 5 },
  { name: 'Tire Service', count: 3, growth: -2 },
  { name: 'Battery Service', count: 2, growth: 8 },
];

export default function ServicesScreen() {
  const router = useRouter();
  const totalServices = serviceCategories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </Pressable>
        <Text style={styles.title}>SERVICES PROVIDED</Text>
        <Pressable style={styles.exportButton}>
          <Download size={20} color="#00F0FF" />
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Tool size={24} color="#00F0FF" />
            <Text style={styles.summaryTitle}>Total Services</Text>
          </View>
          <Text style={styles.summaryAmount}>{totalServices}</Text>
          <View style={styles.summaryFooter}>
            <TrendingUp size={16} color="#00F0FF" />
            <Text style={styles.summaryTrend}>+8% from last week</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Completion Rate</Text>
            <Text style={styles.statValue}>98%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg. Duration</Text>
            <Text style={styles.statValue}>2.5h</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Customer Rating</Text>
            <Text style={styles.statValue}>4.9</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Return Rate</Text>
            <Text style={styles.statValue}>12%</Text>
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Service Categories</Text>
          {serviceCategories.map((category, index) => (
            <View key={index} style={styles.categoryCard}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <View style={styles.categoryStats}>
                  <Activity size={16} color="#7A89FF" />
                  <Text style={styles.categoryCount}>{category.count} services</Text>
                </View>
              </View>
              <View style={[
                styles.growthBadge,
                { backgroundColor: category.growth >= 0 ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 61, 113, 0.1)' }
              ]}>
                <Text style={[
                  styles.growthText,
                  { color: category.growth >= 0 ? '#00F0FF' : '#FF3D71' }
                ]}>
                  {category.growth > 0 ? '+' : ''}{category.growth}%
                </Text>
              </View>
              <View style={[
                styles.progressBar,
                { width: `${(category.count / Math.max(...serviceCategories.map(c => c.count))) * 100}%` }
              ]} />
            </View>
          ))}
        </View>

        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.performanceCard}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>First-Time Fix Rate</Text>
              <Text style={styles.performanceValue}>92%</Text>
              <View style={[styles.performanceBar, { width: '92%' }]} />
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>On-Time Completion</Text>
              <Text style={styles.performanceValue}>95%</Text>
              <View style={[styles.performanceBar, { width: '95%' }]} />
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Customer Satisfaction</Text>
              <Text style={styles.performanceValue}>98%</Text>
              <View style={[styles.performanceBar, { width: '98%' }]} />
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
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
    overflow: 'hidden',
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCount: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
  },
  growthBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  growthText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: '#00F0FF',
  },
  performanceSection: {
    marginBottom: 24,
  },
  performanceCard: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  performanceItem: {
    marginBottom: 16,
  },
  performanceLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
    marginBottom: 8,
  },
  performanceValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    marginBottom: 8,
  },
  performanceBar: {
    height: 4,
    backgroundColor: '#00F0FF',
    borderRadius: 2,
  },
});