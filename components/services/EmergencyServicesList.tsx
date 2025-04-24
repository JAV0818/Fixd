import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import EmergencyServiceCard, { EmergencyServiceProps } from './EmergencyServiceCard';

interface EmergencyServicesListProps {
  title?: string;
  services: EmergencyServiceProps[];
  onServiceSelect: (serviceId: string) => void;
}

const EmergencyServicesList: React.FC<EmergencyServicesListProps> = ({ 
  title = 'Emergency Services',
  services, 
  onServiceSelect 
}) => {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EmergencyServiceCard 
            service={item} 
            onPress={onServiceSelect} 
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});

export default EmergencyServicesList; 