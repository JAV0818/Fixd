import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Award, Clock, Percent, ThumbsUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

type PerformanceMetric = {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  color: string;
};

const PerformanceDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const metrics: PerformanceMetric[] = [
    {
      title: 'Overall Rating',
      value: '4.9',
      icon: <Star size={24} color="#FFD700" />,
      description: 'Average customer rating based on completed services',
      color: '#FFD700'
    },
    {
      title: 'Response Rate',
      value: '98%',
      icon: <Percent size={24} color="#4CAF50" />,
      description: 'Percentage of service requests you respond to within 30 minutes',
      color: '#4CAF50'
    },
    {
      title: 'Completion Rate',
      value: '95%',
      icon: <Award size={24} color="#3F51B5" />,
      description: 'Percentage of accepted services that you complete successfully',
      color: '#3F51B5'
    },
    {
      title: 'On-time Arrival',
      value: '94%',
      icon: <Clock size={24} color="#FF9800" />,
      description: 'Percentage of services where you arrived within the scheduled window',
      color: '#FF9800'
    },
    {
      title: 'Customer Satisfaction',
      value: '96%',
      icon: <ThumbsUp size={24} color="#E91E63" />,
      description: 'Percentage of customers who rated their experience 4 stars or higher',
      color: '#E91E63'
    }
  ];

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
});

export default PerformanceDetailsScreen; 