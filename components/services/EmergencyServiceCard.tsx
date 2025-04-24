import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, ImageSourcePropType } from 'react-native';
import { Clock, DollarSign } from 'lucide-react-native';

export type EmergencyServiceProps = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  price: string;
  eta: string;
};

interface EmergencyServiceCardProps {
  service: EmergencyServiceProps;
  onPress: (serviceId: string) => void;
}

const EmergencyServiceCard: React.FC<EmergencyServiceCardProps> = ({ service, onPress }) => {
  return (
    <Pressable 
      style={styles.card}
      onPress={() => onPress(service.id)}
    >
      <Image source={service.image} style={styles.image} />
      
      <View style={styles.content}>
        <Text style={styles.title}>{service.title}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <DollarSign size={14} color="#7A89FF" />
            <Text style={styles.detailText}>{service.price}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={14} color="#7A89FF" />
            <Text style={styles.detailText}>ETA: {service.eta}</Text>
          </View>
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
    marginRight: 12,
    width: 180,
    height: 220,
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  content: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    color: '#00F0FF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  detailsContainer: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: '#D0DFFF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});

export default EmergencyServiceCard; 