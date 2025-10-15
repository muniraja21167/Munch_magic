import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { useCart, useOrder, useUser } from '../store/hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

export default function TrackOrder({ navigation, route }) {
  const dispatch = useDispatch();
  const { cartItems, lastOrderRestaurant } = useCart();
  const { currentOrder } = useOrder();
  const { customerId } = useUser();

  const [orderData, setOrderData] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  /** --------- simplified demo logic just to render screen --------- */
  const restaurantName =
    orderData?.restaurantName ||
    lastOrderRestaurant?.Name ||
    'Sample Restaurant';

  const displayOrderId = orderData?.orderId || '1234';

  const handlePickup = () => setShowPickupModal(true);
  const handleCallPress = () => setShowCallModal(true);
  const handleMakeCall = () => setShowCallModal(false);
  const handleSubmitReview = () => {
    setShowPickupModal(false);
    setRating(0);
    setReview('');
    navigation.navigate('HomeScreen');
  };

  const renderStars = () => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setRating(star)}
          style={styles.starButton}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={40}
            color={star <= rating ? '#FFD700' : '#DDD'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack?.()}
        >
          <Ionicons name="chevron-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track order</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Restaurant Info */}
        <View style={styles.restaurantSection}>
          <View style={styles.restaurantInfo}>
            <Ionicons name="location" size={20} color="#E53E3E" />
            <Text style={styles.restaurantName}>{restaurantName}</Text>
            <Text style={styles.restaurantDistance}>2.5 miles</Text>
          </View>

          <View style={styles.restaurantActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCallPress}>
              <Ionicons name="call" size={16} color="#E53E3E" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Number */}
        <View style={styles.orderNumberSection}>
          <Text style={styles.orderNumberLabel}>Order #: {displayOrderId}</Text>
        </View>
      </ScrollView>

      {/* Pickup Modal */}
      <Modal visible={showPickupModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPickupModal(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Order Picked Up</Text>
            <Text style={styles.reviewLabel}>Review restaurant</Text>
            {renderStars()}
            <TextInput
              style={styles.reviewInput}
              placeholder="Add Review"
              value={review}
              onChangeText={setReview}
              multiline
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReview}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Call Modal */}
      <Modal visible={showCallModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.callModalContent}>
            <Text style={styles.callModalTitle}>Call</Text>
            <Text style={styles.phoneNumber}>+64 669875425</Text>
            <View style={styles.callButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCallModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callButton} onPress={handleMakeCall}>
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  backButton: { padding: 8 },
  headerSpacer: { width: 32 }, // keeps title centered
  restaurantSection: { marginTop: 20 },
  restaurantInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  restaurantName: { marginLeft: 6, fontSize: 16, fontWeight: '500' },
  restaurantDistance: { marginLeft: 8, color: '#555' },
  restaurantActions: { flexDirection: 'row', marginTop: 10 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: { marginLeft: 4, color: '#E53E3E' },
  orderNumberSection: { marginTop: 20 },
  orderNumberLabel: { fontSize: 16, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth * 0.85,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  closeButton: { alignSelf: 'flex-end' },
  modalTitle: { fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  reviewLabel: { marginTop: 12, fontWeight: '500' },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10 },
  starButton: { marginHorizontal: 4 },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#E53E3E',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
  },
  submitButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  callModalContent: {
    width: screenWidth * 0.75,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  callModalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  phoneNumber: { fontSize: 16, marginBottom: 20 },
  callButtonsContainer: { flexDirection: 'row' },
  cancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ccc',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  callButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#E53E3E',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#000', fontWeight: '600' },
  callButtonText: { color: '#fff', fontWeight: '600' },
});
