import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Download } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const weeklyData = [
  { day: 'Mon', amount: 250 },
  { day: 'Tue', amount: 180 },
  { day: 'Wed', amount: 320 },
  { day: 'Thu', amount: 150 },
  { day: 'Fri', amount: 200 },
  { day: 'Sat', amount: 100 },
  { day: 'Sun', amount: 50 },
];

export default function EarningsScreen() {
  const router = useRouter();
  const totalEarnings = weeklyData.reduce((sum, day) => sum + day.amount, 0);
  const maxAmount = Math.max(...weeklyData.map(day => day.amount));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </Pressable>
        <Text style={styles.title}>WEEKLY EARNINGS</Text>
        <Pressable style={styles.exportButton}>
          <Download size={20} color="#00F0FF" />
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <DollarSign size={24} color="#00F0FF" />
            <Text style={styles.summaryTitle}>Total Earnings</Text>
          </View>
          <Text style={styles.summaryAmount}>${totalEarnings}</Text>
          <View style={styles.summaryFooter}>
            <TrendingUp size={16} color="#00F0FF" />
            <Text style={styles.summaryTrend}>+15% from last week</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
          <View style={styles.chart}>
            {weeklyData.map((day, index) => (
              <View key={day.day} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar, 
                      { height: (day.amount / maxAmount) * 150 }
                    ]} 
                  />
                </View>
                <Text style={styles.barLabel}>{day.day}</Text>
                <Text style={styles.barValue}>${day.amount}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Average Daily</Text>
            <Text style={styles.statValue}>
              ${(totalEarnings / weeklyData.length).toFixed(2)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Highest Day</Text>
            <Text style={styles.statValue}>${maxAmount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Hours</Text>
            <Text style={styles.statValue}>32</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Jobs Completed</Text>
            <Text style={styles.statValue}>15</Text>
          </View>
        </View>

        <View style={styles.transactionsList}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {[1, 2, 3, 4, 5].map((_, index) => (
            <View key={index} style={styles.transaction}>
              <View style={styles.transactionLeft}>
                <Calendar size={20} color="#00F0FF" />
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>Quantum Engine Calibration</Text>
                  <Text style={styles.transactionDate}>Today, 2:30 PM</Text>
                </View>
              </View>
              <Text style={styles.transactionAmount}>+$150</Text>
            </View>
          ))}
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
  chartSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  barContainer: {
    alignItems: 'center',
  },
  barWrapper: {
    height: 150,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    backgroundColor: '#00F0FF',
    borderRadius: 10,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#7A89FF',
  },
  barValue: {
    marginTop: 4,
    fontSize: 12,
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
  transactionsList: {
    marginBottom: 24,
  },
  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A3555',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionInfo: {
    marginLeft: 12,
  },
  transactionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#00F0FF',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
  },
});