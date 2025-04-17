import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, TextInput } from 'react-native';
import { X, Clock, MapPin, DollarSign } from 'lucide-react-native';

export type JobDetails = {
  id: number;
  title: string;
  description: string;
  location: string;
  budget: string;
  posted: string;
  urgency: string;
  images: string[];
  requirements: string[];
};

type JobDetailsModalProps = {
  job: JobDetails;
  onClose: () => void;
  onSubmitBid: (bid: { amount: string; proposal: string }) => void;
};

export default function JobDetailsModal({ job, onClose, onSubmitBid }: JobDetailsModalProps) {
  const [bidAmount, setBidAmount] = React.useState('');
  const [proposal, setProposal] = React.useState('');

  const handleSubmit = () => {
    onSubmitBid({ amount: bidAmount, proposal });
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{job.title}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#1f2937" />
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <MapPin size={16} color="#6b7280" />
                <Text style={styles.detailText}>{job.location}</Text>
              </View>
              <View style={styles.detailItem}>
                <DollarSign size={16} color="#6b7280" />
                <Text style={styles.detailText}>${job.budget}</Text>
              </View>
              <View style={styles.detailItem}>
                <Clock size={16} color="#6b7280" />
                <Text style={styles.detailText}>{job.posted}</Text>
              </View>
            </View>
            <View style={[styles.urgencyBadge, { backgroundColor: job.urgency === 'Urgent' ? '#fee2e2' : '#f3f4f6' }]}>
              <Text style={[styles.urgencyText, { color: job.urgency === 'Urgent' ? '#dc2626' : '#6b7280' }]}>
                {job.urgency}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{job.description}</Text>
          </View>

          {job.images.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Images</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                {job.images.map((image, index) => (
                  <Image key={index} source={{ uri: image }} style={styles.image} />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            {job.requirements.map((requirement, index) => (
              <Text key={index} style={styles.requirement}>• {requirement}</Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Bid</Text>
            <View style={styles.bidForm}>
              <TextInput
                style={styles.bidInput}
                placeholder="Bid Amount ($)"
                value={bidAmount}
                onChangeText={setBidAmount}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.proposalInput}
                placeholder="Write your proposal..."
                value={proposal}
                onChangeText={setProposal}
                multiline
                numberOfLines={4}
              />
              <Pressable style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Submit Bid</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#4b5563',
    lineHeight: 20,
  },
  imageScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
  },
  requirement: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#4b5563',
    marginBottom: 8,
  },
  bidForm: {
    gap: 12,
  },
  bidInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  proposalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#0891b2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
});