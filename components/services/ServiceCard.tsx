import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, ImageSourcePropType } from 'react-native';
import { DollarSign } from 'lucide-react-native';

export type ServiceItemProps = {
  id: string;
  name: string;
  description: string;
  image: ImageSourcePropType;
  price: string;
};

interface ServiceCardProps {
  service: ServiceItemProps;
  onPress: (serviceId: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPress }) => {
  return (
    <Pressable 
      style={styles.card}
      onPress={() => onPress(service.id)}
    >
      <Image source={service.image} style={styles.image} />
      
      <View style={styles.content}>
        <View>
          <Text style={styles.name}>{service.name}</Text>
          <Text style={styles.description}>{service.description}</Text>
        </View>
        
        <View style={styles.priceContainer}>
          <DollarSign size={14} color="#7A89FF" />
          <Text style={styles.price}>{service.price}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A3555',
    marginBottom: 12,
    flexDirection: 'row',
    height: 100,
  },
  image: {
    width: 100,
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  name: {
    color: '#00F0FF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  description: {
    color: '#D0DFFF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    color: '#D0DFFF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});

export default ServiceCard; 