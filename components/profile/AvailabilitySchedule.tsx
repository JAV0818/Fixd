import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Calendar } from 'lucide-react-native';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const timeSlots = ['Morning', 'Afternoon', 'Evening'];

type Schedule = {
  [key: string]: string[];
};

export default function AvailabilitySchedule() {
  const [schedule, setSchedule] = useState<Schedule>({
    Mon: ['Morning', 'Afternoon'],
    Tue: ['Morning', 'Afternoon', 'Evening'],
    Wed: ['Morning', 'Afternoon'],
    Thu: ['Morning', 'Afternoon', 'Evening'],
    Fri: ['Morning', 'Afternoon'],
    Sat: ['Morning'],
    Sun: [],
  });

  const toggleTimeSlot = (day: string, slot: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].includes(slot)
        ? prev[day].filter(s => s !== slot)
        : [...prev[day], slot]
    }));
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Calendar size={20} color="#0891b2" />
        <Text style={styles.title}>Availability Schedule</Text>
      </View>
      <Text style={styles.subtitle}>Set your working hours</Text>

      <View style={styles.scheduleGrid}>
        <View style={styles.headerRow}>
          <View style={styles.dayCell}>
            <Text style={styles.headerText}>Day</Text>
          </View>
          {timeSlots.map(slot => (
            <View key={slot} style={styles.timeCell}>
              <Text style={styles.headerText}>{slot}</Text>
            </View>
          ))}
        </View>

        {days.map(day => (
          <View key={day} style={styles.scheduleRow}>
            <View style={styles.dayCell}>
              <Text style={styles.dayText}>{day}</Text>
            </View>
            {timeSlots.map(slot => (
              <Pressable
                key={slot}
                style={[
                  styles.timeSlot,
                  schedule[day].includes(slot) && styles.timeSlotSelected
                ]}
                onPress={() => toggleTimeSlot(day, slot)}
              >
                {schedule[day].includes(slot) && (
                  <View style={styles.selectedIndicator} />
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
    marginBottom: 16,
  },
  scheduleGrid: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#4b5563',
  },
  scheduleRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dayCell: {
    width: 80,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  timeCell: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#1f2937',
  },
  timeSlot: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  timeSlotSelected: {
    backgroundColor: '#e0f2fe',
  },
  selectedIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0891b2',
  },
});