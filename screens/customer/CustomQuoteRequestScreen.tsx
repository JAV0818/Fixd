import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { componentStyles, colors } from '@/styles/theme';

export default function CustomQuoteRequestScreen() {
  const navigation = useNavigation<any>();
  // Vehicle info broken into year, make, model
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState('');
  const [issueCategory, setIssueCategory] = useState<'engine'|'electrical'|'tires'|'fluids'|'other'>('other');
  const [issueDescription, setIssueDescription] = useState('');
  const [hasWarningLights, setHasWarningLights] = useState<'yes'|'no'>('no');
  const [driveable, setDriveable] = useState<'yes'|'no'|'unsure'>('yes');
  const [preferredTime, setPreferredTime] = useState('');
  const [timing, setTiming] = useState<'asap' | 'specific'>('specific');
  const [preferredDate, setPreferredDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [androidTempDate, setAndroidTempDate] = useState<Date | null>(null);
  const [serviceLocation, setServiceLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Progressive reveal flags
  const showVinMileage = year.trim() && make.trim() && model.trim();
  const showIssueCategory = showVinMileage && (vin.trim() || mileage.trim());
  const showIssueDescription = showIssueCategory;
  const showWarningLights = issueDescription.trim().length > 0;
  const showDriveable = showWarningLights;
  const showPreferredTime = showDriveable;
  const showLocation = showPreferredTime;

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      Alert.alert('Not signed in', 'Please sign in to submit a request.');
      return;
    }
    if (!year.trim() || !make.trim() || !model.trim()) {
      Alert.alert('Missing details', 'Please enter vehicle year, make, and model.');
      return;
    }
    if (!issueDescription.trim()) {
      Alert.alert('Missing details', 'Please describe your issue.');
      return;
    }
    setSubmitting(true);
    try {
      const vehicleInfo = `${year.trim()} ${make.trim()} ${model.trim()}`;
      await addDoc(collection(firestore, 'quoteRequests'), {
        customerId: auth.currentUser.uid,
        vehicleInfo,
        year: year.trim(),
        make: make.trim(),
        model: model.trim(),
        vin: vin.trim() || null,
        mileage: mileage.trim() || null,
        issueCategory,
        description: issueDescription.trim(),
        hasWarningLights,
        driveable,
        preferredTime: timing === 'asap' ? 'ASAP' : preferredTime.trim() || null,
        preferredAt: timing === 'specific' && preferredDate ? preferredDate : null,
        serviceLocation: serviceLocation.trim() || null,
        status: 'submitted', // submitted -> admin reviews -> published/assigned
        createdAt: serverTimestamp(),
      });
      Alert.alert('Submitted', 'Your request was submitted. We will follow up shortly.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      // Reset all fields
      setYear('');
      setMake('');
      setModel('');
      setVin('');
      setMileage('');
      setIssueDescription('');
      setPreferredTime('');
      setPreferredDate(null);
      setServiceLocation('');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Pressable onPress={() => navigation.goBack()} style={{ padding: 6, marginRight: 6 }}>
            <ArrowLeft size={22} color={colors.accent} />
          </Pressable>
          <Text style={styles.title}>Request a Custom Quote</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>1) Submit your request with details about your vehicle and the issue.</Text>
          <Text style={styles.infoText}>2) Admin reviews within 5–15 minutes and either assigns a mechanic or publishes to the marketplace.</Text>
          <Text style={styles.infoText}>3) Mechanics submit quotes; Admin approves quotes before you see them.</Text>
          <Text style={styles.infoText}>4) You review approved quotes and accept your preferred option.</Text>
        </View>

        {/* Step 1: Year, Make, Model */}
        <Text style={styles.label}>Year</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 2018"
          placeholderTextColor="#6E7191"
          value={year}
          onChangeText={setYear}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Make</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Honda"
          placeholderTextColor="#6E7191"
          value={make}
          onChangeText={setMake}
        />

        <Text style={styles.label}>Model</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Accord 2.0T"
          placeholderTextColor="#6E7191"
          value={model}
          onChangeText={setModel}
        />

        {/* Step 2: VIN and Mileage (only show after Y/M/M) */}
        {showVinMileage && (
          <>
            <Text style={styles.label}>VIN (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="17-character VIN"
              placeholderTextColor="#6E7191"
              value={vin}
              onChangeText={setVin}
              autoCapitalize="characters"
              maxLength={17}
            />

            <Text style={styles.label}>Mileage (approx.)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 86,000"
              placeholderTextColor="#6E7191"
              value={mileage}
              onChangeText={setMileage}
              keyboardType="number-pad"
            />
          </>
        )}

        {/* Step 3: Issue Category */}
        {showIssueCategory && (
          <>
            <Text style={styles.label}>Issue Category</Text>
            <View style={styles.pillRow}>
              {(['engine','electrical','tires','fluids','other'] as const).map(cat => (
                <Pressable key={cat} style={[styles.pill, issueCategory === cat && styles.pillActive]} onPress={() => setIssueCategory(cat)}>
                  <Text style={[styles.pillText, issueCategory === cat && styles.pillTextActive]}>{cat.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Step 4: Issue Description */}
        {showIssueDescription && (
          <>
            <Text style={styles.label}>Describe the issue</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="What's happening? Any warning lights, noises, leaks, etc."
              placeholderTextColor="#6E7191"
              value={issueDescription}
              onChangeText={setIssueDescription}
              multiline
            />
          </>
        )}

        {/* Step 5: Warning lights */}
        {showWarningLights && (
          <>
            <Text style={styles.label}>Warning lights?</Text>
            <View style={styles.pillRow}>
              {(['yes','no'] as const).map(val => (
                <Pressable key={val} style={[styles.pill, hasWarningLights === val && styles.pillActive]} onPress={() => setHasWarningLights(val)}>
                  <Text style={[styles.pillText, hasWarningLights === val && styles.pillTextActive]}>{val.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Step 6: Driveable */}
        {showDriveable && (
          <>
            <Text style={styles.label}>Is the vehicle driveable?</Text>
            <View style={styles.pillRow}>
              {(['yes','no','unsure'] as const).map(val => (
                <Pressable key={val} style={[styles.pill, driveable === val && styles.pillActive]} onPress={() => setDriveable(val)}>
                  <Text style={[styles.pillText, driveable === val && styles.pillTextActive]}>{val.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Step 7: Preferred time (EST) - native picker with platform-specific handling */}
        {showPreferredTime && (
          <>
            <Text style={styles.label}>Preferred time</Text>
            <View style={styles.pillRow}>
              <Pressable
                style={[styles.pill, timing === 'asap' && styles.pillActive]}
                onPress={() => setTiming('asap')}
              >
                <Text style={[styles.pillText, timing === 'asap' && styles.pillTextActive]}>ASAP</Text>
              </Pressable>
              <Pressable
                style={[styles.pill, timing === 'specific' && styles.pillActive]}
                onPress={() => setTiming('specific')}
              >
                <Text style={[styles.pillText, timing === 'specific' && styles.pillTextActive]}>Choose a time</Text>
              </Pressable>
            </View>

            {timing === 'specific' && (
              Platform.OS === 'ios' ? (
                <>
                  <Pressable
                    style={[styles.input, { justifyContent: 'center' }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: '#FFFFFF' }}>
                      {preferredDate ? `${preferredDate.toLocaleString()} (EST)` : 'Select date and time'}
                    </Text>
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={preferredDate || new Date()}
                      mode="datetime"
                      display={'spinner'}
                      onChange={(event: any, date?: Date) => {
                        if (date) {
                          setPreferredDate(date);
                          setPreferredTime(date.toISOString());
                        }
                      }}
                    />
                  )}
                </>
              ) : (
                <>
                  <Pressable
                    style={[styles.input, { justifyContent: 'center' }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: '#FFFFFF' }}>
                      {preferredDate ? `${preferredDate.toLocaleString()} (EST)` : 'Select date and time'}
                    </Text>
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={preferredDate || new Date()}
                      mode="date"
                      display={'spinner'}
                      onChange={(event: any, date?: Date) => {
                        setShowDatePicker(false);
                        if (date) {
                          setAndroidTempDate(date);
                          setShowTimePicker(true);
                        }
                      }}
                    />
                  )}
                  {showTimePicker && (
                    <DateTimePicker
                      value={preferredDate || new Date()}
                      mode="time"
                      display={'spinner'}
                      onChange={(event: any, time?: Date) => {
                        setShowTimePicker(false);
                        if (time) {
                          const base = androidTempDate || new Date();
                          const final = new Date(
                            base.getFullYear(),
                            base.getMonth(),
                            base.getDate(),
                            time.getHours(),
                            time.getMinutes(),
                            0,
                            0
                          );
                          setPreferredDate(final);
                          setPreferredTime(final.toISOString());
                          setAndroidTempDate(null);
                        }
                      }}
                    />
                  )}
                </>
              )
            )}
          </>
        )}

        {/* Step 8: Service Location */}
        {showLocation && (
          <>
            <Text style={styles.label}>Service location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 123 Main St, Atlanta, GA"
              placeholderTextColor="#6E7191"
              value={serviceLocation}
              onChangeText={setServiceLocation}
            />
          </>
        )}

        {/* Submit button visible when at least Y/M/M and description are complete */}
        {showPreferredTime && (
          <Pressable
            style={[componentStyles.tealButton, { alignItems: 'center', marginTop: 16 }]}
            disabled={submitting}
            onPress={handleSubmit}
          >
            <Text style={{ color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>{submitting ? 'Submitting…' : 'Submit Request'}</Text>
          </Pressable>
        )}
      </ScrollView>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  content: { padding: 16 },
  title: { color: colors.accent, fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  infoBox: { marginTop: 8, marginBottom: 20, borderWidth: 1, borderColor: '#2A3555', borderRadius: 12, padding: 12, backgroundColor: 'rgba(26, 33, 56, 1)' },
  infoTitle: { color: colors.accent, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  infoText: { color: '#D0DFFF', marginBottom: 4 },
  label: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', marginTop: 10, marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(18, 24, 39, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3555',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, marginBottom: 10 },
  pill: {
    borderWidth: 1,
    borderColor: '#2A3555',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(18, 24, 39, 0.8)',
  },
  pillActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  pillText: {
    color: '#7A89FF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  pillTextActive: {
    color: colors.accent,
  },
});


