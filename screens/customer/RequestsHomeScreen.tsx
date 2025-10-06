import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { componentStyles, colors } from '@/styles/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RequestsHomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Requests & Support</Text>
        
        <Pressable 
          style={[componentStyles.tealButton, styles.card]}
          onPress={() => navigation.navigate('CustomerQuotes')}
        >
          <Text style={styles.cardTitle}>View My Quotes</Text>
          <Text style={styles.cardText}>Review, accept, or decline quotes from mechanics and admins.</Text>
        </Pressable>

        <Pressable 
          style={[componentStyles.tealButton, styles.card]}
          onPress={() => navigation.navigate('RequestQuote')}
        >
          <Text style={styles.cardTitle}>Request a Custom Quote</Text>
          <Text style={styles.cardText}>Submit a new request for a custom service or repair.</Text>
        </Pressable>

        {/* <Pressable 
          style={[componentStyles.tealButton, styles.card]}
          onPress={() => navigation.navigate('Support')}
        >
          <Text style={styles.cardTitle}>Support</Text>
          <Text style={styles.cardText}>Chat with an admin for help with your account or a service.</Text>
        </Pressable> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  content: {
    padding: 16,
  },
  title: {
    color: colors.accent,
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 20,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  cardTitle: {
    color: colors.accent,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  cardText: {
    color: '#D0DFFF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
});


