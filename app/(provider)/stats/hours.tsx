import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, TrendingUp, Calendar, Download } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const hourlyData = [
  { hour: '9AM', hours: 2 },
  { hour: '10AM', hours: 3 },
  { hour: '11AM', hours: 1 },
  { hour: '12PM', hours: 2 },
  { hour: '1PM', hours: 3 },
  { hour: '2PM', hours: 2 },
  { hour: '3PM', hours: 1 },
  { hour: '4PM', hours: 2 },
];

export default function HoursScreen() {
  const router = useRouter();
  const totalHours = hourlyData.reduce((sum, hour) => sum + hour.hours, 0);
  const maxHours = Math.max(...hourlyData.map(hour => hour.hours));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#00F0FF" />
        </Pressable>
        <Text style={styles.title}>TOTAL HOURS</Text>
        <Pressable style={styles.exportButton}>
          <Download size={20} color="#00F0FF" />
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Clock size={24} color="#00F0FF" />
            <Text style={styles.summaryTitle}>Weekly Hours</Text>
          </View>
          <Text style={styles.summaryAmount}>{totalHours}h</Text>
          <View style={styles.summaryFooter}>
            <TrendingUp size={16} color="#00F0FF" />
            <Text style={styles.summaryTrend}>+5% from last week</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Today's Timeline</Text>
          <View style={styles.chart}>
            {hourlyData.map((hour, index) => (
              <View key={hour.hour} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar, 
                      { height: (hour.hours / maxHours) * 150 }
                    ]} 
                  />
                </View>
                <Text style={styles.barLabel}>{hour.hour}</Text>
                <Text style={styles.barValue}>{hour.hours}h</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Daily Average</Text>
            <Text style={styles.statValue}>6.5h</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Peak Hours</Text>
            <Text style={styles.statValue}>10AM-2PM</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Break Time</Text>
            <Text style={styles.statValue}>1.5h</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Overtime</Text>
            <Text style={styles.statValue}>2h</Text>
          </View>
        </View>

        <View style={styles.scheduleList}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          {[1, 2, 3, 4, 5].map((_, index) => (
            <View key={index} style={styles.scheduleItem}>
              <View style={styles.scheduleLeft}>
                <Calendar size={20} color="#00F0FF" />
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleTitle}>Engine Diagnostics</Text>
                  <Text style={styles.scheduleTime}>10:30 AM - 12:30 PM</Text>
                </View>
              </View>
              <Text style={styles.scheduleDuration}>2h</Text>
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
  scheduleList: {
    marginBottom: 24,
  },
  scheduleItem: {
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
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleInfo: {
    marginLeft: 12,
  },
  scheduleTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#00F0FF',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  scheduleDuration: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
  },
});