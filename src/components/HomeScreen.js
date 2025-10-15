import React, { useEffect, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { useCart, useFavorites } from '../store/hooks';
import { clearCart, addToCart } from '../store/slices/cartSlice';
import { toggleRestaurantFavorite } from '../store/slices/favoritesSlice';
import CurvedTabBar from './BottomTabScreen';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 67;
const CURVE_RADIUS = 40;

export default function HomeScreen({ navigation }) {
  
  const dispatch = useDispatch();
  const { cartItems, cartCount, totalAmount } = useCart();

  useEffect(() => {
    console.log('🔄 HomeScreen - Cart state changed:', {
      cartCount: cartCount, // Total quantity from Redux
      uniqueItems: cartItems.length, // Number of unique items
      cartItems: cartItems.map(item => ({
        id: item.menuItem?.id,
        name: item.menuItem?.Name || item.menuItem?.name,
        restaurant: item.restaurant?.Name || item.restaurant?.name,
        quantity: item.quantity || 1,
      })),
    });
  }, [cartCount, cartItems]);

  // Check cart state when HomeScreen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log(
        '🏠 HomeScreen - Screen focused, resetting activeTab to Home',
      );
      setActiveTab('Home'); // Reset to Home when screen is focused

      console.log('🏠 HomeScreen - Screen focused, checking cart:', {
        cartCount: cartCount, // Total quantity from Redux
        uniqueItems: cartItems.length, // Number of unique items
        shouldShowPopup: cartCount > 0,
      });
    }, [cartCount, cartItems]),
  );

  // Placeholder data for instant loading
  const initialPlaceholderData = [
    {
      id: 1,
      Name: 'zudio',
      imageUrl:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop&auto=format&q=75',
      avgrating: '4.5',
      preparationTime: '12-17 min',
      distance: 2.5,
      bagsLeft: 3,
      pickupTime: '11:00 AM - 10:00 PM',
      reviewCount: 25,
    },
    {
      id: 2,
      Name: 'Thai Garden',
      imageUrl:
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop&auto=format&q=75',
      avgrating: '4.2',
      preparationTime: '15-20 min',
      distance: 3.1,
      bagsLeft: 5,
      pickupTime: '12:00 PM - 11:00 PM',
      reviewCount: 18,
    },
    {
      id: 3,
      Name: 'American Diner',
      imageUrl:
        'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=200&fit=crop&auto=format&q=75',
      avgrating: '4.8',
      preparationTime: '8-12 min',
      distance: 1.8,
      bagsLeft: 2,
      pickupTime: '10:00 AM - 9:00 PM',
      reviewCount: 42,
    },
  ];

  const [activeTab, setActiveTab] = useState('Home');
  const [surplusData, setSurplusData] = useState(initialPlaceholderData);
  const [allRestaurants, setAllRestaurants] = useState(initialPlaceholderData);
  const [originalSurplusData, setOriginalSurplusData] = useState(
    initialPlaceholderData,
  );
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAllRestaurants, setShowAllRestaurants] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Nearest');
  const [showRestaurantMenu, setShowRestaurantMenu] = useState(false);
  const [restaurantMenuData, setRestaurantMenuData] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [failedImages, setFailedImages] = useState({}); // Track failed images and their fallback URLs
  const [searchButtonPressed, setSearchButtonPressed] = useState(false);
  const [currentRestaurantIndex, setCurrentRestaurantIndex] = useState(0);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);

  // Use Redux state for favorites instead of local state
  const { favoriteRestaurants: reduxFavorites } = useFavorites();

  // Dynamic request body parameters
  const [userLocation, setUserLocation] = useState({
    latitude: null,
    longitude: null,
    address: null,
  });
  const [customerId, setCustomerId] = useState(172);

  const flatListRef = useRef(null);
  const promoScrollRef = useRef(null);

  useEffect(() => {
    // Fetch real data in background (placeholder already loaded from initial state)
    fetchRestaurantsData();

    setShowLocationModal(true);
  }, []);

  // Auto-scroll promo banners
  useEffect(() => {
    const promoBanners = [
      require('./assets/images/promotionalbnr-1.png'),
      require('./assets/images/promotionalbnr-2.png'),
    ];

    const interval = setInterval(() => {
      setCurrentPromoIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % promoBanners.length;

        // Scroll to the next banner
        if (promoScrollRef.current) {
          promoScrollRef.current.scrollTo({
            x: nextIndex * 356, // 340 (width) + 16 (margin)
            animated: true,
          });
        }

        return nextIndex;
      });
    }, 8000); // Change banner every 8 seconds

    return () => clearInterval(interval);
  }, []);

  // Get local restaurant image based on restaurant name
  const getLocalRestaurantImage = restaurantName => {
    if (!restaurantName) return null;

    const name = restaurantName.toLowerCase();

    if (name.includes('wingstop')) {
      return require('./assets/images/wingstop.png');
    } else if (name.includes('barrique')) {
      return require('./assets/images/barrique.png');
    } else if (name.includes('domino')) {
      return require('./assets/images/dominos.png');
    } else if (name.includes('pizza pot') || name.includes('pizza pot pies')) {
      return require('./assets/images/pizza.png');
    }

    return null;
  };

  // Generate unique defaults for each restaurant to avoid duplicates
  const generateUniqueRestaurantDefaults = (index, restaurantName) => {
    const name = restaurantName?.toLowerCase() || '';

    // Different rating ranges based on restaurant type
    let ratingBase = 4.0;
    if (name.includes('hari') || name.includes('kitchen')) {
      ratingBase = 4.0;
    } else if (name.includes('create') || name.includes('restaurant')) {
      ratingBase = 4.2;
    } else if (name.includes('zudio')) {
      ratingBase = 4.5;
    } else if (name.includes('thai')) {
      ratingBase = 4.2;
    } else if (name.includes('american')) {
      ratingBase = 4.8;
    }

    // Add small variation based on index
    const rating = (ratingBase + index * 0.1).toFixed(1);

    // Different bags left based on index
    const bagsLeft = Math.max(1, 8 - index);

    // Different distances based on index
    const distance = (2.5 + index * 0.8).toFixed(1);

    // Different preparation times
    const prepTimes = [
      '8-12 min',
      '10-15 min',
      '12-17 min',
      '15-20 min',
      '5-10 min',
    ];
    const preparationTime = prepTimes[index % prepTimes.length];

    // Different pickup times
    const pickupTimes = [
      '11:00 AM - 10:00 PM',
      '12:00 PM - 11:00 PM',
      '10:00 AM - 9:00 PM',
      '9:00 AM - 11:00 PM',
      '10:30 AM - 9:30 PM',
    ];
    const pickupTime = pickupTimes[index % pickupTimes.length];

    // Different review counts
    const reviewCount = 15 + index * 8;

    return {
      rating,
      preparationTime,
      distance: parseFloat(distance),
      bagsLeft,
      pickupTime,
      reviewCount,
    };
  };

  // Get default restaurant image based on restaurant name and index
  const getDefaultRestaurantImage = (restaurantName, index = 0) => {
    if (!restaurantName) {
      return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop&auto=format&q=75';
    }

    const name = restaurantName.toLowerCase();

    // Different images for different restaurant types
    if (name.includes('hari') || name.includes('kitchen')) {
      return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop&auto=format&q=75';
    } else if (name.includes('create') || name.includes('restaurant')) {
      return 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=200&fit=crop&auto=format&q=75';
    } else if (name.includes('zudio')) {
      return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop&auto=format&q=75';
    } else if (name.includes('burger') || name.includes('fast')) {
      return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop&auto=format&q=75';
    } else if (name.includes('thai')) {
      return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop&auto=format&q=75';
    } else if (name.includes('american')) {
      return 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=200&fit=crop&auto=format&q=75';
    }

    // Use index to cycle through different default images
    const defaultImages = [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop&auto=format&q=75',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop&auto=format&q=75',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=200&fit=crop&auto=format&q=75',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop&auto=format&q=75',
    ];

    return defaultImages[index % defaultImages.length];
  };

  // Optimized image URL function
  const getOptimizedImageUrl = (originalUrl, width = 300, height = 200) => {
    if (!originalUrl || originalUrl.includes('placeholder')) {
      return `https://via.placeholder.com/${width}x${height}/f0f0f0/999?text=Loading...`;
    }

    // If it's an Unsplash URL, optimize it
    if (originalUrl.includes('unsplash.com')) {
      // Check if URL already has optimization parameters
      if (originalUrl.includes('&w=') || originalUrl.includes('&h=')) {
        return originalUrl;
      }
      return `${originalUrl}&w=${width}&h=${height}&fit=crop&crop=center&auto=format&q=75`;
    }

    // For other URLs, return as is but could be enhanced with a CDN
    return originalUrl;
  };

  // Handle image loading states
  const handleImageLoadStart = imageId => {
    setImageLoadingStates(prev => ({ ...prev, [imageId]: 'loading' }));
  };

  const handleImageLoadEnd = imageId => {
    setImageLoadingStates(prev => ({ ...prev, [imageId]: 'loaded' }));
  };

  const handleImageError = (imageId, item, index = 0) => {
    console.log(`❌ Image failed to load for ${imageId}:`, item?.Name);
    const fallbackUrl = getDefaultRestaurantImage(item?.Name, index);
    console.log(`🔄 Setting fallback URL for ${item?.Name}: ${fallbackUrl}`);
    setFailedImages(prev => ({ ...prev, [imageId]: fallbackUrl }));
    setImageLoadingStates(prev => ({ ...prev, [imageId]: 'loading' })); // Set to loading to trigger re-render
  };

  // Get the appropriate image URL (original or fallback)
  const getImageUrl = (imageId, originalUrl, item, index = 0) => {
    if (failedImages[imageId]) {
      console.log(
        `🔄 Using fallback image for ${item?.Name}: ${failedImages[imageId]}`,
      );
      return failedImages[imageId];
    }
    const finalUrl =
      originalUrl || getDefaultRestaurantImage(item?.Name, index);
    console.log(`🖼️ Using image for ${item?.Name}: ${finalUrl}`);
    return finalUrl;
  };

  // Function to create dynamic request body
  const createRequestBody = (additionalParams = {}) => {
    return {
      latitude: userLocation.latitude || '12.9234082',
      longitude: userLocation.longitude || '77.6492223',
      customerId: customerId || 172,
      ...additionalParams,
    };
  };

  // Function to update user location
  const updateUserLocation = (latitude, longitude, address) => {
    setUserLocation({ latitude, longitude, address });
    fetchRestaurantsData();
  };

  // Function to update customer ID
  const updateCustomerId = newCustomerId => {
    setCustomerId(newCustomerId);
    fetchRestaurantsData();
  };

  // Handle location permission - navigate to LocationListScreen
  const handleLocationPermission = async () => {
    try {
      console.log('📍 Navigating to LocationListScreen...');

      // Close the modal first
      setShowLocationModal(false);

      // Navigate to LocationListScreen
      if (navigation && navigation.navigate) {
        navigation.navigate('LocationListScreen');
        console.log('✅ Navigation to LocationListScreen successful');
      } else {
        console.log('❌ Navigation not available');
        Alert.alert(
          'Navigation Error',
          'Navigation not available. Please restart the app.',
        );
      }
    } catch (error) {
      console.error('❌ Navigation error:', error);
      Alert.alert(
        'Navigation Error',
        `Could not navigate to location screen: ${error.message}`,
      );
    }
  };

  // Handle location modal cancel - show full home screen
  const handleLocationCancel = () => {
    setShowLocationModal(false);
    console.log(
      '📍 User chose to continue without location permission - home screen ready',
    );
  };

  // Open device location settings
  const openLocationSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const fetchRestaurantsData = async () => {
    try {
      const requestBody = createRequestBody();

      // Add request timeout for better performance
      const fetchWithTimeout = (url, options, timeout = 5000) => {
        return Promise.race([
          fetch(url, options),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout),
          ),
        ]);
      };

      // Try external server directly for better performance
      const externalUrl = 'http://18.219.192.152:3052/api/restaurants';

      const res = await fetchWithTimeout(
        externalUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
        5000,
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();

      // Handle different response structures
      let restaurantsData = [];

      if (json.success && Array.isArray(json.data)) {
        restaurantsData = json.data;
      } else if (Array.isArray(json.data)) {
        restaurantsData = json.data;
      } else if (Array.isArray(json)) {
        restaurantsData = json;
      }

      // Optimize data processing - use unique defaults for each restaurant
      restaurantsData = restaurantsData.map((restaurant, index) => {
        // Check for broken image URLs (like the default.jpg that returns 404)
        let imageUrl = restaurant.imageUrl || restaurant.image;
        if (imageUrl && imageUrl.includes('default.jpg')) {
          console.log(
            `⚠️ Detected broken image URL for ${restaurant.Name}, using fallback`,
          );
          imageUrl = getDefaultRestaurantImage(restaurant.Name, index);
        }

        // Generate unique values for each restaurant to avoid duplicates
        const uniqueDefaults = generateUniqueRestaurantDefaults(
          index,
          restaurant.Name,
        );

        return {
          ...restaurant,
          imageUrl:
            imageUrl || getDefaultRestaurantImage(restaurant.Name, index),
          avgrating:
            restaurant.avgrating || restaurant.rating || uniqueDefaults.rating,
          preparationTime:
            restaurant.preparationTime ||
            restaurant.preparation_time ||
            uniqueDefaults.preparationTime,
          distance:
            restaurant.distance ||
            restaurant.distance_km ||
            uniqueDefaults.distance,
          bagsLeft:
            restaurant.bagsLeft ||
            restaurant.bags_left ||
            uniqueDefaults.bagsLeft,
          pickupTime:
            restaurant.pickupTime ||
            restaurant.pickup_time ||
            uniqueDefaults.pickupTime,
          reviewCount:
            restaurant.reviewCount ||
            restaurant.review_count ||
            uniqueDefaults.reviewCount,
        };
      });

      // Add test data if no restaurants are loaded
      if (restaurantsData.length === 0) {
        restaurantsData = [
          {
            id: 1,
            Name: 'zudio',
            imageUrl:
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop&auto=format&q=75',
            avgrating: '4.5',
            preparationTime: '12-17 min',
            distance: 2.5,
            bagsLeft: 3,
            pickupTime: '11:00 AM - 10:00 PM',
            reviewCount: 25,
          },
          {
            id: 2,
            Name: 'Test Restaurant 2',
            imageUrl:
              'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop&auto=format&q=75',
            avgrating: '4.2',
            preparationTime: '15-20 min',
            distance: 3.1,
            bagsLeft: 5,
            pickupTime: '12:00 PM - 11:00 PM',
            reviewCount: 18,
          },
          {
            id: 3,
            Name: 'Test Restaurant 3',
            imageUrl:
              'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=200&fit=crop&auto=format&q=75',
            avgrating: '4.8',
            preparationTime: '8-12 min',
            distance: 1.8,
            bagsLeft: 2,
            pickupTime: '10:00 AM - 9:00 PM',
            reviewCount: 42,
          },
        ];
      }

      setOriginalSurplusData(restaurantsData);
      setSurplusData(restaurantsData);
      setAllRestaurants(restaurantsData);
    } catch (err) {
      console.error('❌ Error fetching restaurants:', err.message);

      // Use fallback test data on error
      const fallbackData = [
        {
          id: 1,
          Name: 'zudio',
          imageUrl:
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop&auto=format&q=75',
          avgrating: '4.5',
          preparationTime: '12-17 min',
          distance: 2.5,
          bagsLeft: 3,
          pickupTime: '11:00 AM - 10:00 PM',
          reviewCount: 25,
        },
      ];

      setOriginalSurplusData(fallbackData);
      setSurplusData(fallbackData);
      setAllRestaurants(fallbackData);
    }
  };

  const fetchRestaurantMenu = async (restaurantId = 2) => {
    try {
      const requestBody = createRequestBody({ restaurantId });

      const res = await fetch('http://18.219.192.152:3052/api/restaurantMenu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const json = await res.json();
      return json;
    } catch (err) {
      return null;
    }
  };

  const handleRestaurantPress = async restaurant => {
    console.log(
      '🏪 Navigating to RestaurantDetailScreen for:',
      restaurant.Name,
    );
    console.log('🏪 Restaurant ID:', restaurant.id);
    console.log('🧭 Navigation object:', navigation);

    if (!restaurant || !restaurant.id) {
      console.log('❌ Invalid restaurant data:', restaurant);
      Alert.alert('Error', 'Invalid restaurant data. Please try again.');
      return;
    }

    try {
      // Ensure restaurant has all required fields
      const restaurantData = {
        ...restaurant,
        imageUrl:
          restaurant.imageUrl || getDefaultRestaurantImage(restaurant.Name),
        avgrating: restaurant.avgrating || '4.0',
        preparationTime: restaurant.preparationTime || '10-15 min',
        distance: restaurant.distance || 2.5,
        bagsLeft: restaurant.bagsLeft || 5,
        pickupTime: restaurant.pickupTime || '11:00 AM - 10:00 PM',
        reviewCount: restaurant.reviewCount || 10,
      };

      console.log('🏪 Restaurant data being passed:', restaurantData);

      if (navigation && navigation.navigate) {
        navigation.navigate('RestaurantDetailScreen', {
          restaurant: restaurantData,
        });
        console.log('✅ Navigation call successful');
      } else {
        console.log('❌ Navigation not available');
        Alert.alert(
          'Error',
          'Navigation not available. Please restart the app.',
        );
      }
    } catch (error) {
      console.log('❌ Navigation error:', error);
      Alert.alert(
        'Navigation Error',
        `Could not navigate to restaurant details: ${error.message}`,
      );
    }
  };

  const handleBackToFilters = () => {
    setShowRestaurantMenu(false);
    setRestaurantMenuData(null);
    setSelectedRestaurant(null);
    setActiveCategoryId(null);
  };

  const handleSearchPress = () => {
    // Visual feedback
    setSearchButtonPressed(true);
    setTimeout(() => setSearchButtonPressed(false), 200);

    try {
      // Try multiple navigation methods
      if (navigation && navigation.navigate) {
        navigation.navigate('SearchScreen');
      } else if (navigation && navigation.push) {
        navigation.push('SearchScreen');
      } else {
        Alert.alert(
          'Navigation Error',
          'Navigation not available. Please restart the app.',
        );
      }
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(
        'Navigation Error',
        `Could not navigate to search screen: ${error.message}`,
      );
    }
  };

  const handleCategoryPress = async category => {
    try {
      const filteredRestaurants = await fetchRestaurantsByType(category.name);

      if (filteredRestaurants && filteredRestaurants.length > 0) {
        setSurplusData(filteredRestaurants);
        setAllRestaurants(filteredRestaurants);
        setActiveCategoryId(category.id);
        setSelectedCategory(category);
        setCurrentSlide(0);
      } else {
        Alert.alert(
          'No Results',
          `No restaurants found offering ${category.name} food. Please try another category.`,
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Something went wrong while loading ${category.name} restaurants. Please try again.`,
        [{ text: 'OK' }],
      );
    }
  };

  const getTestRestaurantsByCategory = categoryType => {
    const baseRestaurants = [
      {
        id: 1,
        Name: 'Burger Palace',
        imageUrl:
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=200&fit=crop',
        avgrating: '4.5',
        preparationTime: '10-15 min',
        distance: 2.5,
        bagsLeft: 3,
        pickupTime: '11:00 AM - 10:00 PM',
        restaurantType: [{ restaurentType: 'Burgers' }],
      },
      {
        id: 2,
        Name: 'Thai Garden',
        imageUrl:
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop',
        avgrating: '4.2',
        preparationTime: '15-20 min',
        distance: 3.1,
        bagsLeft: 5,
        pickupTime: '12:00 PM - 11:00 PM',
        restaurantType: [{ restaurentType: 'Thai' }],
      },
      {
        id: 3,
        Name: 'American Diner',
        imageUrl:
          'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=200&fit=crop',
        avgrating: '4.8',
        preparationTime: '8-12 min',
        distance: 1.8,
        bagsLeft: 2,
        pickupTime: '10:00 AM - 9:00 PM',
        restaurantType: [{ restaurentType: 'American' }],
      },
      {
        id: 4,
        Name: 'Fast Bites',
        imageUrl:
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop',
        avgrating: '4.0',
        preparationTime: '5-10 min',
        distance: 1.2,
        bagsLeft: 8,
        pickupTime: '9:00 AM - 11:00 PM',
        restaurantType: [{ restaurentType: 'Fast Food' }],
      },
      {
        id: 5,
        Name: 'Sandwich Central',
        imageUrl:
          'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&h=200&fit=crop',
        avgrating: '4.3',
        preparationTime: '12-18 min',
        distance: 2.8,
        bagsLeft: 4,
        pickupTime: '10:30 AM - 9:30 PM',
        restaurantType: [{ restaurentType: 'Sandwiches' }],
      },
    ];

    return baseRestaurants.filter(restaurant => {
      if (restaurant.restaurantType && restaurant.restaurantType.length > 0) {
        return restaurant.restaurantType.some(type => {
          const typeName =
            type.restaurentType || type.restaurantType || type.name || '';
          return typeName.toLowerCase().includes(categoryType.toLowerCase());
        });
      }
      return false;
    });
  };

  const fetchRestaurantsByType = async categoryType => {
    try {
      const requestBody = createRequestBody();

      // Add request timeout
      const fetchWithTimeout = (url, options, timeout = 5000) => {
        return Promise.race([
          fetch(url, options),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout),
          ),
        ]);
      };

      const externalUrl = 'http://18.219.192.152:3052/api/restaurants';

      const res = await fetchWithTimeout(
        externalUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
        5000,
      );

      const json = await res.json();

      if (json.success && json.data) {
        const filteredRestaurants = json.data.filter(restaurant => {
          if (
            restaurant.restaurantType &&
            restaurant.restaurantType.length > 0
          ) {
            return restaurant.restaurantType.some(type => {
              const typeName =
                type.restaurentType || type.restaurantType || type.name || '';
              return typeName
                .toLowerCase()
                .includes(categoryType.toLowerCase());
            });
          }
          return false;
        });

        // If no restaurants found with API filtering, use test data for development
        if (filteredRestaurants.length === 0) {
          console.log(
            `No ${categoryType} restaurants found in API, using test data`,
          );
          return getTestRestaurantsByCategory(categoryType);
        }

        return filteredRestaurants;
      }

      return [];
    } catch (err) {
      throw new Error(`Failed to fetch ${categoryType} restaurants`);
    }
  };

  const handleClearCategoryFilter = () => {
    setSurplusData(originalSurplusData);
    setAllRestaurants(originalSurplusData);
    setActiveCategoryId(null);
    setSelectedCategory(null);
    setCurrentSlide(0);
    setCurrentRestaurantIndex(0);
  };

  const goToNextRestaurant = () => {
    if (allRestaurants && allRestaurants.length > 0) {
      const nextIndex = (currentRestaurantIndex + 1) % allRestaurants.length;
      setCurrentRestaurantIndex(nextIndex);
    }
  };

  const goToPrevRestaurant = () => {
    if (allRestaurants && allRestaurants.length > 0) {
      const prevIndex =
        currentRestaurantIndex === 0
          ? allRestaurants.length - 1
          : currentRestaurantIndex - 1;
      setCurrentRestaurantIndex(prevIndex);
    }
  };

  const handleShowAllToggle = () => {
    setShowAllRestaurants(!showAllRestaurants);
    setCurrentRestaurantIndex(0);
  };

  // Handle adding item to cart from HomeScreen
  const handleAddToCartFromHome = restaurant => {
    console.log(
      '🛒 HomeScreen - Adding item to cart from restaurant:',
      restaurant.Name,
    );

    // Create a mock menu item for demonstration
    const mockMenuItem = {
      id: `home_${restaurant.id}`,
      Name: `Surplus Bag`, // More appropriate name for surplus food
      amount: '1.0000',
      imageUrl: 'https://picsum.photos/60/60?random=1',
      description: 'Surplus food bag from ' + restaurant.Name,
    };

    console.log('🛒 HomeScreen - Mock menu item created:', mockMenuItem);
    console.log('🛒 HomeScreen - Restaurant data:', restaurant);

    try {
      // Add to cart using Redux
      console.log('🛒 HomeScreen - Calling Redux addToCart...');
      dispatch(
        addToCart({
          menuItem: mockMenuItem,
          restaurant: restaurant,
          customizations: {
            quantity: 1,
            selectedSize: 'Medium',
            removedItems: [],
            addedItems: [],
            totalPrice: parseFloat(mockMenuItem.amount) || 0,
          },
        }),
      );

      console.log('✅ HomeScreen - Item added to cart successfully');
      console.log('🛒 HomeScreen - Cart state after adding:', {
        cartCount,
        cartItems: cartItems.length,
      });
    } catch (error) {
      console.error('❌ HomeScreen - Error adding to cart:', error.message);
    }
  };

  // Handle favorite restaurant toggle using Redux
  const handleToggleFavorite = async restaurant => {
    if (isTogglingFavorite) return; // Prevent multiple simultaneous requests

    setIsTogglingFavorite(true);
    const restaurantId = restaurant.id;
    const isCurrentlyFavorite = reduxFavorites.some(r => r.id === restaurantId);
    const newFavoriteStatus = !isCurrentlyFavorite;

    try {
      console.log(
        '❤️ Toggling favorite for restaurant:',
        restaurant.Name,
        'ID:',
        restaurantId,
      );
      console.log(
        '❤️ Current status:',
        isCurrentlyFavorite,
        'New status:',
        newFavoriteStatus,
      );

      // Use Redux action to toggle favorite
      await dispatch(
        toggleRestaurantFavorite({
          restaurant,
          isAdding: newFavoriteStatus,
          latitude: userLocation.latitude || '12.9234082',
          longitude: userLocation.longitude || '77.6492223',
          customerId: customerId || 172,
        }),
      ).unwrap();

      console.log('✅ Favorite toggled successfully via Redux');
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);

      let errorMessage = 'Failed to update favorite. Please try again.';

      if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage, [
        { text: 'Try Again', onPress: () => handleToggleFavorite(restaurant) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const applyFilter = filterType => {
    setActiveFilter(filterType);
    setCurrentSlide(0);
    setCurrentRestaurantIndex(0);

    let filteredData = [...originalSurplusData];

    if (filteredData.length === 0) {
      return;
    }

    switch (filterType) {
      case 'Nearest':
        filteredData = filteredData.sort((a, b) => {
          const distanceA = parseFloat(a.distance) || 999;
          const distanceB = parseFloat(b.distance) || 999;
          return distanceA - distanceB;
        });
        break;

      case 'Iconic':
        filteredData = filteredData.filter(restaurant => {
          const rating = parseFloat(restaurant.avgrating) || 0;
          const reviewCount = parseInt(restaurant.reviewCount) || 0;
          const name = restaurant.Name?.toLowerCase() || '';

          const isRatedWithReviews = rating >= 3.5 && reviewCount >= 5;
          const hasAnyReviews = reviewCount > 0;
          const isPopularBrand =
            name.includes('mcdonald') ||
            name.includes('kfc') ||
            name.includes('domino') ||
            name.includes('pizza hut') ||
            name.includes('subway') ||
            name.includes('starbucks') ||
            name.includes('burger king') ||
            name.includes('taco bell') ||
            name.includes('wingstop') ||
            name.includes('barrique');

          return isRatedWithReviews || hasAnyReviews || isPopularBrand;
        });

        if (filteredData.length === 0) {
          filteredData = [...originalSurplusData];
        }
        break;

      case 'Rating':
        filteredData = filteredData.sort((a, b) => {
          const ratingA = parseFloat(a.avgrating) || 0;
          const ratingB = parseFloat(b.avgrating) || 0;
          const reviewCountA = parseInt(a.reviewCount) || 0;
          const reviewCountB = parseInt(b.reviewCount) || 0;

          if (ratingB !== ratingA) {
            return ratingB - ratingA;
          }
          return reviewCountB - reviewCountA;
        });
        break;

      case 'Deals':
        filteredData = filteredData.filter(restaurant => {
          return restaurant.hasDeals || restaurant.discount || restaurant.offer;
        });

        if (filteredData.length === 0) {
          filteredData = [...originalSurplusData];
        }
        break;

      case 'Open Now':
        filteredData = filteredData.filter(restaurant => {
          return restaurant.isOpen !== false;
        });

        if (filteredData.length === 0) {
          filteredData = [...originalSurplusData];
        }
        break;

      default:
        filteredData = filteredData.sort((a, b) => {
          const distanceA = a.distance || 0;
          const distanceB = b.distance || 0;
          return distanceA - distanceB;
        });
    }

    if (filteredData.length === 0) {
      filteredData = [...originalSurplusData];
    }

    setSurplusData(filteredData);
  };

  const categories = [
    {
      id: '1',
      name: 'National Picks',
      icon: require('./assets/images/national-favs.png'),
    },
    {
      id: '2',
      name: 'American',
      icon: require('./assets/images/american-food.png'),
    },
    { id: '3', name: 'Thai', icon: require('./assets/images/thai-food.png') },
    { id: '4', name: 'Burgers', icon: require('./assets/images/sandwich.png') },
    { id: '5', name: 'Fast Food', icon: require('./assets/images/snacks.png') },
    {
      id: '6',
      name: 'Sandwiches',
      icon: require('./assets/images/sandwich.png'),
    },
  ];

  const goToNextSlide = () => {
    try {
      if (
        surplusData &&
        surplusData.length > 0 &&
        currentSlide < surplusData.length - 1
      ) {
        const nextSlide = currentSlide + 1;
        setCurrentSlide(nextSlide);
        if (flatListRef.current) {
          const slideWidth = 316; // card width + margin
          flatListRef.current.scrollTo({
            x: nextSlide * slideWidth,
            animated: true,
          });
        }
      }
    } catch (error) {
      console.warn('Error in goToNextSlide:', error);
    }
  };

  const goToPrevSlide = () => {
    try {
      if (surplusData && surplusData.length > 0 && currentSlide > 0) {
        const prevSlide = currentSlide - 1;
        setCurrentSlide(prevSlide);
        if (flatListRef.current) {
          const slideWidth = 316; // card width + margin
          flatListRef.current.scrollTo({
            x: prevSlide * slideWidth,
            animated: true,
          });
        }
      }
    } catch (error) {
      console.warn('Error in goToPrevSlide:', error);
    }
  };

  const onScroll = event => {
    try {
      if (event && event.nativeEvent && event.nativeEvent.contentOffset) {
        const slideSize = 296;
        const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
        if (index >= 0 && surplusData && index < surplusData.length) {
          setCurrentSlide(index);
        }
      }
    } catch (error) {
      console.warn('Error in onScroll:', error);
    }
  };

  const renderSurplusCard = ({ item, index, fullWidth = false }) => {
    if (!item || !item.id) {
      return null;
    }

    const imageId = `surplus-${item.id}`;
    const currentImageUrl = getImageUrl(imageId, item.imageUrl, item, index);
    const optimizedUrl = getOptimizedImageUrl(
      currentImageUrl,
      fullWidth ? 400 : 300,
      138,
    );

    return (
      <TouchableOpacity
        style={fullWidth ? styles.surplusCardFullWidth : styles.surplusCard}
        onPress={() => handleRestaurantPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image
            source={
              getLocalRestaurantImage(item.Name) || {
                uri: optimizedUrl,
                cache: 'force-cache',
              }
            }
            style={
              fullWidth ? styles.surplusImageFullWidth : styles.surplusImage
            }
            resizeMode="cover"
            onLoadStart={() => handleImageLoadStart(imageId)}
            onLoadEnd={() => handleImageLoadEnd(imageId)}
            onError={error => {
              console.log(
                `❌ Image failed for ${item.Name}, setting fallback...`,
              );
              handleImageError(imageId, item, index);
            }}
          />
          {imageLoadingStates[imageId] === 'loading' && (
            <View style={styles.imageLoadingOverlay}>
              <ActivityIndicator size="small" color="#E53E3E" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}
          {imageLoadingStates[imageId] === 'error' && (
            <View style={styles.imageErrorOverlay}>
              <Icon name="image-outline" size={24} color="#999" />
              <Text style={styles.errorText}>Image unavailable</Text>
            </View>
          )}
        </View>

        {!fullWidth &&
          surplusData &&
          surplusData.length > 0 &&
          currentSlide > 0 && (
            <TouchableOpacity
              style={styles.leftArrowContainer}
              onPress={goToPrevSlide}
            >
              <Icon name="chevron-back" size={10} color="#000" />
            </TouchableOpacity>
          )}

        {!fullWidth &&
          surplusData &&
          surplusData.length > 0 &&
          currentSlide < surplusData.length - 1 && (
            <TouchableOpacity
              style={styles.rightArrowContainer}
              onPress={goToNextSlide}
            >
              <Icon name="chevron-forward" size={10} color="#000" />
            </TouchableOpacity>
          )}

        <View style={styles.surplusTopOverlay}>
          <Text style={styles.bagsLeftText}>
            {item.bagsLeft || '0'} Bags Left
          </Text>
          <TouchableOpacity
            style={styles.heartIconContainer}
            onPress={() => handleToggleFavorite(item)}
            disabled={isTogglingFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name={
                reduxFavorites.some(r => r.id === item.id)
                  ? 'heart'
                  : 'heart-outline'
              }
              size={16}
              color={
                reduxFavorites.some(r => r.id === item.id) ? '#E53E3E' : 'red'
              }
            />
          </TouchableOpacity>
        </View>

        <View style={styles.surplusContentBox}>
          <View style={styles.nameAndRatingRow}>
            <Text style={styles.surplusName} numberOfLines={1}>
              {item.Name}
            </Text>
            <View style={styles.ratingBadge}>
              <Icon name="star" size={12} color="#fff" />
              <Text style={styles.ratingBadgeText}>
                {parseFloat(item.avgrating || '4.5').toFixed(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.detailText}>
            {item.preparationTime || '5-10 min'} |{' '}
            {item.distance?.toFixed(1) || '3.9'} miles
          </Text>
          <Text style={styles.pickupTime}>
            Pickup Time: {item.pickupTime || 'Call for house'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRestaurantCard = ({ item, index = 0 }) => {
    if (!item || !item.id) {
      return null;
    }

    const imageId = `restaurant-${item.id}`;
    const currentImageUrl = getImageUrl(imageId, item.imageUrl, item, index);
    const optimizedUrl = getOptimizedImageUrl(currentImageUrl, 350, 180);

    return (
      <TouchableOpacity
        style={styles.restaurantCard}
        onPress={() => handleRestaurantPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.restaurantImageContainer}>
          <Image
            source={
              getLocalRestaurantImage(item.Name) || {
                uri: optimizedUrl,
                cache: 'force-cache',
              }
            }
            style={styles.restaurantImage}
            resizeMode="cover"
            onLoadStart={() => handleImageLoadStart(imageId)}
            onLoadEnd={() => handleImageLoadEnd(imageId)}
            onError={error => {
              console.log(
                `❌ Image failed for ${item.Name}, setting fallback...`,
              );
              handleImageError(imageId, item, index);
            }}
          />
          {imageLoadingStates[imageId] === 'loading' && (
            <View style={styles.restaurantImageLoadingOverlay}>
              <ActivityIndicator size="medium" color="#E53E3E" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}
          {imageLoadingStates[imageId] === 'error' && (
            <View style={styles.restaurantImageLoadingOverlay}>
              <Icon name="image-outline" size={32} color="#999" />
              <Text style={styles.errorText}>Image unavailable</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.restaurantHeartContainer}
          onPress={() => handleToggleFavorite(item)}
          disabled={isTogglingFavorite}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon
            name={
              reduxFavorites.some(r => r.id === item.id)
                ? 'heart'
                : 'heart-outline'
            }
            size={20}
            color={
              reduxFavorites.some(r => r.id === item.id) ? '#E53E3E' : 'red'
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restaurantCartContainer}
          onPress={() => handleAddToCartFromHome(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="bag-outline" size={20} color="#E53E3E" />
        </TouchableOpacity>

        <View style={styles.offerBadge}>
          <Text style={styles.offerText}>{item.offer || 'Special Deal'}</Text>
        </View>

        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantHeader}>
            <Text style={styles.restaurantName}>{item.Name}</Text>
            <View style={styles.ratingBadge}>
              <Icon name="star" size={12} color="#fff" />
              <Text style={styles.ratingBadgeText}>
                {parseFloat(item.avgrating || '4.5').toFixed(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.restaurantTiming}>
            {item.preparationTime || '5-10 min'} |{' '}
            {item.distance?.toFixed(1) || '3.9'} miles
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftHeaderSection}>
          <View style={styles.coinsContainer}>
            <Image
              source={require('./assets/images/dollar.png')}
              style={styles.dollarIcon}
            />
            <Text style={styles.coins}> {customerId || '0'}</Text>
          </View>
          <View style={styles.locationContainer}>
            <Image
              source={require('./assets/images/location-arrow.png')}
              style={styles.locationArrow}
            />
            <Text style={styles.locationText}>Home</Text>
            <Icon name="chevron-down" size={14} color="#666" />
          </View>
          <Text style={styles.address}>
            {userLocation.address || '622 Circle Drive Houston, TX 77019'}
          </Text>
        </View>
        <View style={styles.rightHeaderSection}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="notifications-outline" size={20} color="#00000082" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image
              source={require('./assets/images/megaphone.png')}
              style={styles.megaphone}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconButton,
              searchButtonPressed && styles.iconButtonPressed,
            ]}
            onPress={handleSearchPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name="search-outline"
              size={20}
              color={searchButtonPressed ? '#E53E3E' : '#00000082'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: cartCount > 0 ? 100 : 0 }}
      >
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((item, index) => {
              if (!item) return null;
              return (
                <TouchableOpacity
                  key={`category-${item.id || index}-${item.name || 'unknown'}`}
                  style={styles.categoryItem}
                  onPress={() => handleCategoryPress(item)}
                >
                  <Image source={item.icon} style={styles.categoryIcon} />
                  <Text
                    style={[
                      styles.categoryText,
                      activeCategoryId === item.id && styles.activeCategoryText,
                    ]}
                  >
                    {item.name || 'Category'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {['Nearest', 'Iconic', 'Rating', 'Deals', 'Open Now'].map(
              filter => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    activeFilter === filter && styles.activeFilterChip,
                  ]}
                  onPress={() => applyFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      activeFilter === filter && styles.activeFilterText,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </ScrollView>
        </View>

        {selectedCategory && (
          <View style={styles.categoryFilterInfo}>
            <View style={styles.categoryFilterHeader}>
              <Text style={styles.categoryFilterText}>
                Showing {selectedCategory.name} restaurants (
                {surplusData.length})
              </Text>
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={handleClearCategoryFilter}
              >
                <Text style={styles.clearFilterText}>Show All</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!showAllRestaurants ? (
          <View style={styles.promoBanner}>
            <View style={styles.promoCarouselContainer}>
              <ScrollView
                ref={promoScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.promoContent}
                scrollEnabled={false} // Disable manual scrolling for auto-scroll
              >
                <TouchableOpacity
                  onPress={() => {
                    try {
                      if (navigation && navigation.navigate) {
                        navigation.navigate('PromotionalOffers');
                        console.log('✅ Navigated to PromotionalOffers');
                      } else {
                        Alert.alert(
                          'Navigation Error',
                          'Navigation not available. Please restart the app.',
                        );
                      }
                    } catch (error) {
                      console.error(
                        'PromotionalOffers navigation error:',
                        error,
                      );
                      Alert.alert(
                        'Navigation Error',
                        `Could not navigate to promotional offers: ${error.message}`,
                      );
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={require('./assets/images/promotionalbnr-1.png')}
                    style={styles.promoImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    try {
                      if (navigation && navigation.navigate) {
                        navigation.navigate('PromotionalOffers');
                        console.log('✅ Navigated to PromotionalOffers');
                      } else {
                        Alert.alert(
                          'Navigation Error',
                          'Navigation not available. Please restart the app.',
                        );
                      }
                    } catch (error) {
                      console.error(
                        'PromotionalOffers navigation error:',
                        error,
                      );
                      Alert.alert(
                        'Navigation Error',
                        `Could not navigate to promotional offers: ${error.message}`,
                      );
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={require('./assets/images/promotionalbnr-2.png')}
                    style={styles.promoImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </ScrollView>

              {/* Left Chevron */}
              {currentPromoIndex > 0 && (
                <TouchableOpacity
                  style={styles.promoLeftChevron}
                  onPress={() => {
                    const prevIndex = currentPromoIndex - 1;
                    setCurrentPromoIndex(prevIndex);
                    if (promoScrollRef.current) {
                      promoScrollRef.current.scrollTo({
                        x: prevIndex * 356, // 340 (width) + 16 (margin)
                        animated: true,
                      });
                    }
                  }}
                >
                  <Icon name="chevron-back" size={10} color="#000" />
                </TouchableOpacity>
              )}

              {/* Right Chevron */}
              {currentPromoIndex < 1 && (
                <TouchableOpacity
                  style={styles.promoRightChevron}
                  onPress={() => {
                    const nextIndex = currentPromoIndex + 1;
                    setCurrentPromoIndex(nextIndex);
                    if (promoScrollRef.current) {
                      promoScrollRef.current.scrollTo({
                        x: nextIndex * 356, // 340 (width) + 16 (margin)
                        animated: true,
                      });
                    }
                  }}
                >
                  <Icon name="chevron-forward" size={10} color="#000" />
                </TouchableOpacity>
              )}
            </View>

            {/* Promo Banner Indicators */}
            <View style={styles.promoIndicators}>
              <View
                style={[
                  styles.promoDot,
                  currentPromoIndex === 0 && styles.promoDotActive,
                ]}
              />
              <View
                style={[
                  styles.promoDot,
                  currentPromoIndex === 1 && styles.promoDotActive,
                ]}
              />
            </View>
          </View>
        ) : (
          <View style={styles.verticalRestaurantsSection}>
            <View style={styles.restaurantsHeader}>
              <Text style={styles.restaurantsTitle}>
                All Restaurants ({allRestaurants.length})
              </Text>
              <TouchableOpacity onPress={handleShowAllToggle}>
                <Text style={styles.showLessText}>Show Less</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.verticalRestaurantsList}
            >
              {allRestaurants && allRestaurants.length > 0 ? (
                allRestaurants.map((item, index) => {
                  if (!item || !item.id) return null;
                  return (
                    <View
                      key={`vertical-restaurant-${item.id || index}`}
                      style={styles.verticalRestaurantItem}
                    >
                      {renderSurplusCard({ item, index, fullWidth: true })}
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No restaurants available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {!showAllRestaurants && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Surplus</Text>
              <TouchableOpacity
                onPress={handleShowAllToggle}
                style={{
                  backgroundColor: showAllRestaurants ? '#E53E3E' : '#f0f0f0',
                  padding: 8,
                  borderRadius: 4,
                }}
              >
                <Icon
                  name={showAllRestaurants ? 'chevron-up' : 'chevron-forward'}
                  size={18}
                  color={showAllRestaurants ? '#fff' : '#666'}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.surplusCarouselContainer}>
              {surplusData && surplusData.length > 0 ? (
                <ScrollView
                  ref={flatListRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.surplusContent}
                  decelerationRate="fast"
                  onScroll={onScroll}
                  scrollEventThrottle={16}
                >
                  {surplusData.map((item, index) => {
                    if (!item || !item.id) return null;
                    return (
                      <View key={`surplus-${item.id || index}`}>
                        {renderSurplusCard({ item, index })}
                      </View>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No restaurants available</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <CurvedTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navigation={navigation}
      />

      {/* Cart Summary Popup - Only show if there are items in cart */}
      {cartCount > 0 && (
        <View style={styles.cartPopupOverlay}>
          <View style={styles.cartPopup}>
            {/* Item Image */}
            <View style={styles.cartPopupImageContainer}>
              {(() => {
                const imageUrl =
                  cartItems[0]?.menuItem?.imageUrl ||
                  cartItems[0]?.menuItem?.image ||
                  cartItems[0]?.menuItem?.Image ||
                  cartItems[0]?.menuItem?.menuImageUrl ||
                  'https://picsum.photos/60/60?random=1';

                return (
                  <Image
                    source={
                      imageUrl
                        ? { uri: imageUrl }
                        : require('./assets/images/sandwich.png')
                    }
                    style={styles.cartPopupImage}
                    resizeMode="cover"
                    onError={error => {
                      // Image failed to load, fallback will be used
                    }}
                    onLoad={() => {
                      // Image loaded successfully
                    }}
                  />
                );
              })()}
            </View>

            {/* Item Details */}
            <View style={styles.cartPopupDetails}>
              <Text style={styles.cartPopupItemName} numberOfLines={1}>
                {cartItems.length === 0
                  ? 'No items in cart'
                  : cartItems[0]?.menuItem?.Name ||
                    cartItems[0]?.menuItem?.name ||
                    cartItems[0]?.menuItem?.title ||
                    'Menu Item'}
              </Text>
              <Text style={styles.cartPopupRestaurantName} numberOfLines={1}>
                {cartItems.length > 0
                  ? cartItems[0]?.restaurant?.Name ||
                    cartItems[0]?.restaurant?.name ||
                    'Restaurant'
                  : 'Add items to cart'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.cartPopupButton}
              onPress={() => navigation.navigate('CartScreen_1')}
            >
              <Text style={styles.cartPopupButtonText}>
                View Cart {cartCount} item{cartCount > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cartPopupCloseButton}
              onPress={() => {
                console.log('🗑️ HomeScreen - Clearing entire cart');
                console.log('🗑️ HomeScreen - Cart state before clearing:', {
                  cartCount,
                  cartItems: cartItems.length,
                });
                dispatch(clearCart());
                console.log('✅ HomeScreen - Cart cleared successfully');
                console.log('🗑️ HomeScreen - Cart state after clearing:', {
                  cartCount,
                  cartItems: cartItems.length,
                });
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Location Permission Modal */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleLocationCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.locationModal}>
            <Text style={styles.locationModalTitle}>Location</Text>
            <Text style={styles.locationModalMessage}>
              For a better experience, turn on device locations, which uses
              Google location services
            </Text>
            <View style={styles.locationModalButtons}>
              <TouchableOpacity
                style={styles.locationCancelButton}
                onPress={handleLocationCancel}
              >
                <Text style={styles.locationCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.locationOkButton}
                onPress={handleLocationPermission}
              >
                <Text style={styles.locationOkButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  leftHeaderSection: {
    flex: 1,
  },
  rightHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 20,
  },
  coins: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 6,
    color: '#000',
  },
  iconButton: {
    marginLeft: 12,
    padding: 4,
  },
  iconButtonPressed: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  megaphone: {
    width: 20,
    height: 20,
    marginLeft: 12,
  },
  address: {
    fontSize: 12,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  filtersContainer: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  filtersContent: {
    paddingHorizontal: 1,
    marginLeft: 16,
  },
  filterChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterChip: {
    backgroundColor: 'red',
    borderColor: 'red',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 18,
    width: 70,
  },
  categoryIcon: {
    width: 51,
    height: 46,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
  },
  categoryText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#000',
    fontWeight: '800',
    width: 100,
  },
  activeCategoryText: {
    color: '#E53E3E',
  },
  promoBanner: {
    marginBottom: 20,
  },
  promoCarouselContainer: {
    position: 'relative',
  },
  promoContent: {
    paddingLeft: 16,
  },
  promoLeftChevron: {
    position: 'absolute',
    left: 60,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: '#ffff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  promoRightChevron: {
    position: 'absolute',
    right: 60,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: '#ffff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  promoImage: {
    width: 340,
    height: 160,
    borderRadius: 6,
    marginRight: 16,
  },
  promoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  promoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  promoDotActive: {
    backgroundColor: '#E53E3E',
  },
  surplusContent: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  surplusCarouselContainer: {
    position: 'relative',
    paddingTop: 5,
  },
  allRestaurantsContainer: {
    flex: 1,
  },
  leftArrowContainer: {
    position: 'absolute',
    left: 8,
    top: '35%',
    transform: [{ translateY: -16 }],
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  rightArrowContainer: {
    position: 'absolute',
    right: 8,
    top: '35%',
    transform: [{ translateY: -16 }],
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
    fontWeight: '400',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  surplusCard: {
    height: 240,
    width: 300,
    marginBottom: 20,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  surplusCardFullWidth: {
    height: 240,
    width: '100%',
    marginBottom: 20,
    marginRight: 0,
    backgroundColor: '#fff',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  surplusImage: {
    width: 300,
    height: 138,
  },
  surplusImageFullWidth: {
    width: '100%',
    height: 138,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  imageErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  restaurantImageContainer: {
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: 180,
  },
  restaurantImageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  surplusTopOverlay: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bagsLeftText: {
    backgroundColor: '#E53E3E',
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  heartIconContainer: {
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
  },
  surplusContentBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  nameAndRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  surplusName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    backgroundColor: '#E53E3E',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  pickupTime: {
    fontSize: 11,
    color: '#444',
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  restaurantHeartContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    zIndex: 2,
  },
  restaurantCartContainer: {
    position: 'absolute',
    top: 8,
    right: 50,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    zIndex: 2,
  },
  offerBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#E53E3E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 2,
  },
  offerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  restaurantInfo: {
    padding: 12,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantRating: {
    backgroundColor: '#E53E3E',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  restaurantTiming: {
    fontSize: 12,
    color: '#666',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    height: 80,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  navItemCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
    marginTop: -20,
  },
  centerIcon: {
    width: 52,
    height: 52,
    borderRadius: 30,
    backgroundColor: '#E53E3E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },
  navTextCenter: {
    fontSize: 12,
    marginTop: 4,
    color: '#E53E3E',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  donationIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  spoonForkIcon: {
    width: 22,
    height: 32,
    resizeMode: 'contain',
  },
  activeNavText: {
    color: '#E53E3E',
    fontWeight: 'bold',
  },
  dollarIcon: {
    width: 20,
    height: 20,
    marginLeft: -7,
  },
  locationArrow: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  categoryFilterInfo: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryFilterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  clearFilterButton: {
    backgroundColor: '#E53E3E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearFilterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  singleRestaurantView: {
    paddingHorizontal: 16,
  },
  restaurantNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  navButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  restaurantCounter: {
    backgroundColor: '#E53E3E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  counterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  restaurantDetails: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  restaurantStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
    fontWeight: '500',
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  showAllText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
    fontWeight: '500',
  },
  verticalRestaurantsSection: {
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  restaurantsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  showLessText: {
    fontSize: 14,
    color: '#E53E3E',
    fontWeight: '500',
  },
  verticalRestaurantsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  verticalRestaurantItem: {
    marginBottom: 5,
    width: '100%',
  },
  // Cart Popup Styles - Matching Screenshot Design
  cartPopupOverlay: {
    position: 'absolute',
    bottom: 90, // Position just above the bottom navigation tabs
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  cartPopup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cartPopupImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#f8f8f8',
  },
  cartPopupImage: {
    width: '100%',
    height: '100%',
  },
  cartPopupDetails: {
    flex: 1,
    marginRight: 12,
  },
  cartPopupItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  cartPopupRestaurantName: {
    fontSize: 13,
    color: '#666',
    marginBottom: 0,
  },
  cartPopupButton: {
    backgroundColor: '#E53E3E',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8,
    width: 80,
  },
  cartPopupButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cartPopupCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Location Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  locationModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  locationModalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  locationModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  locationCancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E53E3E',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  locationCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53E3E',
  },
  locationOkButton: {
    flex: 1,
    backgroundColor: '#E53E3E',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  locationOkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
