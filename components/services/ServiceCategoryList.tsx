import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import ServiceCard, { ServiceItemProps } from './ServiceCard';

export type ServiceCategoryProps = {
  title: string;
  services: ServiceItemProps[];
};

interface ServiceCategoryListProps {
  categories: ServiceCategoryProps[];
  onServiceSelect: (serviceId: string) => void;
}

const ServiceCategoryList: React.FC<ServiceCategoryListProps> = ({ 
  categories, 
  onServiceSelect 
}) => {
  return (
    <View style={styles.container}>
      {categories.map((category, index) => (
        <View key={`category-${index}`} style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          
          {category.services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onPress={onServiceSelect}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
});

export default ServiceCategoryList; 