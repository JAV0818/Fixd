import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Calendar, MapPin, Check } from 'lucide-react-native';
import { NavigationProp } from '@react-navigation/native';
import { ProviderStackParamList } from '@/navigation/ProviderNavigator'; // Adjust path if needed
import { RepairOrder } from '@/types/orders'; // Adjust path if needed

// Define props for the component
interface RequestCardProps {
  item: RepairOrder;
  navigation: NavigationProp<ProviderStackParamList>;
}

const RequestCard: React.FC<RequestCardProps> = ({ item, navigation }) => {
  // Format data for display (copied from RequestsScreen)
  const displayAddress = `${item.locationDetails.city}, ${item.locationDetails.state}`;
  const displayService = item.items.length > 0 ? item.items[0].name : 'Unknown Service';
  const displayDate = item.createdAt?.toDate().toLocaleDateString() || 'N/A';
  const displayCustomerName = item.customerId.substring(0, 8) + '...'; // Placeholder
  const placeholderAvatar = 'https://via.placeholder.com/48?text=User'; // Placeholder

  return (
    <TouchableOpacity 
      style={styles.requestCard}
      // Navigate to detail screen with correct param name
      onPress={() => navigation.navigate('RequestDetail', { orderId: item.id })}
    >
      {/* Card Line Indicator */}
      <View style={styles.cardLine} /> 

      <View style={styles.cardHeader}>
        <Image source={{ uri: placeholderAvatar }} style={styles.avatar} />
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{displayCustomerName.toUpperCase()}</Text>
          <Text style={styles.serviceName}>{displayService}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Calendar size={16} color="#00F0FF" />
          <Text style={styles.infoText}>{displayDate}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <MapPin size={16} color="#00F0FF" />
          <Text style={styles.infoText}>{displayAddress}</Text>
        </View>
      </View>
      
      {/* Actions - Keep the "View Details" button clear */}
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.startButton]}
          // Also navigate to detail screen with correct param name
          onPress={() => navigation.navigate('RequestDetail', { orderId: item.id })}
        >
          <Check size={16} color="#0A0F1E" />
          <Text style={styles.startButtonText}>VIEW DETAILS</Text>
        </TouchableOpacity>
        {/* Other actions (like quick accept/decline) could be added here later if desired */}
      </View>
    </TouchableOpacity>
  );
};

// Styles (copied and slightly adjusted from RequestsScreen)
const styles = StyleSheet.create({
  requestCard: {
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3555',
    position: 'relative', // Needed for cardLine
    overflow: 'hidden', // Ensure content stays within rounded corners
  },
  cardLine: { // Vertical line indicator
    position: 'absolute',
    left: 0,
    top: 16, // Align with padding
    bottom: 16, // Align with padding
    width: 3, // Make it slightly thicker
    backgroundColor: '#00F0FF',
    borderTopRightRadius: 3, // Optional: round corners
    borderBottomRightRadius: 3, // Optional: round corners
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginLeft: 10, // Indent content past the line
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1, // Thinner border now line exists
    borderColor: '#7A89FF', // Less prominent color
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14, // Slightly smaller
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: 13, // Slightly smaller
    fontFamily: 'Inter_400Regular',
    color: '#A0AFFF', // Lighter variant
  },
  statusContainer: {
    paddingHorizontal: 8, // Adjust padding
    paddingVertical: 3,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 6, // Smaller radius
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.5)', // Softer border
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    letterSpacing: 0.5,
  },
  cardContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(42, 53, 85, 0.5)', // Softer separator
    paddingTop: 12,
    marginBottom: 16,
    marginLeft: 10, // Indent content past the line
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13, // Slightly smaller
    fontFamily: 'Inter_400Regular',
    color: '#E0EFFF', // Lighter text
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align button to the right
    marginLeft: 10, // Indent content past the line
    marginTop: 8, // Add some space above actions
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    // Removed minWidth to let button size naturally
  },
  startButton: {
    backgroundColor: '#00F0FF',
    borderColor: '#00F0FF',
  },
  startButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#0A0F1E',
    marginLeft: 6, // Adjust spacing
    letterSpacing: 0.5,
  },
  // Removed cancel/contact button styles for now
});

export default RequestCard; 