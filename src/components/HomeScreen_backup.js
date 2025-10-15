import React, { useEffect, useState, useRef } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
// import Image from 'react-native-fast-image';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [surplusData, setSurplusData] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [originalSurplusData, setOriginalSurplusData] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAllRestaurants, setShowAllRestaurants] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Nearest');
  const [showRestaurantMenu, setShowRestaurantMenu] = useState(false);
  const [restaurantMenuData, setRestaurantMenuData] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  
  // Dynamic request body parameters
  const [userLocation, setUserLocation] = useState({
    latitude: null,
    longitude: null,
    address: null
  });
  const [customerId, setCustomerId] = useState(172);
  
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchRestaurantsData();
  }, []);

  // Optimized image URL function
  const getOptimizedImageUrl = (originalUrl, width = 300, height = 200) => {
    if (!originalUrl || originalUrl.includes('placeholder')) {
      return `https://via.placeholder.com/${width}x${height}/f0f0f0/999?text=Loading...`;
    }

    // If it's an Unsplash URL, optimize it
    if (originalUrl.includes('unsplash.com')) {
      return `${originalUrl}&w=${width}&h=${height}&fit=crop&crop=center&auto=format&q=75`;
    }

    // For other URLs, return as is but could be enhanced with a CDN
    return originalUrl;
  };

  // Handle image loading states
  const handleImageLoadStart = (imageId) => {
    setImageLoadingStates(prev => ({ ...prev, [imageId]: 'loading' }));
  };

  const handleImageLoadEnd = (imageId) => {
    setImageLoadingStates(prev => ({ ...prev, [imageId]: 'loaded' }));
  };

  const handleImageError = (imageId) => {
    setImageLoadingStates(prev => ({ ...prev, [imageId]: 'error' }));
  };

  // Function to create dynamic request body
  const createRequestBody = (additionalParams = {}) => {
    return {
      latitude: userLocation.latitude || '0',
      longitude: userLocation.longitude || '0',
      customerId: customerId || 1,
      ...additionalParams
    };
  };

  // Function to update user location
  const updateUserLocation = (latitude, longitude) => {
    setUserLocation({ latitude, longitude });
    // Refresh restaurants data when location changes
    fetchRestaurantsData();
  };

  // Function to update customer ID
  const updateCustomerId = (newCustomerId) => {
    setCustomerId(newCustomerId);
    // Refresh restaurants data when customer changes
    fetchRestaurantsData();
  };

  const fetchRestaurantsData = async () => {
    try {
      const requestBody = createRequestBody();

      const res = await fetch('http://18.219.192.152:3052/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const json = await res.json();

      // Set both surplus and all restaurants data
      const restaurantsData = json.data || [];
      setOriginalSurplusData(restaurantsData);
      setSurplusData(restaurantsData);
      setAllRestaurants(restaurantsData);
    } catch (err) {
      // Handle error silently or show user-friendly message
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


  const handleRestaurantPress = async (restaurant) => {
    navigation.navigate('RestaurantDetailScreen', { restaurant });
  };

  const handleBackToFilters = () => {
    setShowRestaurantMenu(false);
    setRestaurantMenuData(null);
    setSelectedRestaurant(null);
    // Also clear category selection if any
    setActiveCategoryId(null);
  };

  const handleSearchPress = () => {
    navigation.navigate('SearchScreen');
  };

  const handleCategoryPress = async (category) => {
    try {
      // Fetch restaurants that match the selected category type
      const filteredRestaurants = await fetchRestaurantsByType(category.name);
      
      if (filteredRestaurants && filteredRestaurants.length > 0) {
        // Just filter the main restaurant list and highlight the category
        setSurplusData(filteredRestaurants);
        setAllRestaurants(filteredRestaurants);
        setActiveCategoryId(category.id);
        setSelectedCategory(category);
        setCurrentSlide(0); // Reset carousel
      } else {
        Alert.alert(
          'No Results',
          `No restaurants found offering ${category.name} food. Please try another category.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Something went wrong while loading ${category.name} restaurants. Please try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const fetchRestaurantsByType = async (categoryType) => {
    try {
      // First, get all restaurants
      const requestBody = createRequestBody();

      const res = await fetch('http://18.219.192.152:3052/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const json = await res.json();
      
      if (json.success && json.data) {
        // Filter restaurants by restaurentType that matches the category
        const filteredRestaurants = json.data.filter(restaurant => {
          if (restaurant.restaurantType && restaurant.restaurantType.length > 0) {
            // Check if any of the restaurant types match the selected category
            return restaurant.restaurantType.some(type => 
              type.restaurentType?.toLowerCase() === categoryType.toLowerCase()
            );
          }
          return false;
        });

        return filteredRestaurants;
      }
      
      return [];
    } catch (err) {
      throw new Error(`Failed to fetch ${categoryType} restaurants`);
    }
  };

  const handleClearCategoryFilter = () => {
    // Reset to show all restaurants
    setSurplusData(originalSurplusData);
    setAllRestaurants(originalSurplusData);
    setActiveCategoryId(null);
    setSelectedCategory(null);
    setCurrentSlide(0);
  };

  const getCategorySubtitle = (categoryName) => {
    switch (categoryName?.toLowerCase()) {
      case 'national picks':
        return 'Discover America\'s favorite dishes from coast to coast';
      case 'american':
        return 'Classic American comfort food and local favorites';
      case 'thai':
        return 'Authentic Thai flavors with traditional spices and herbs';
      case 'burgers':
        return 'Juicy burgers with fresh ingredients and bold flavors';
      case 'fast food':
        return 'Quick and delicious meals for busy lifestyles';
      case 'sandwiches':
        return 'Fresh sandwiches made with premium ingredients';
      default:
        return 'Explore delicious options in this category';
    }
  };

  const applyFilter = (filterType) => {
    setActiveFilter(filterType);
    setCurrentSlide(0); // Reset carousel to first slide
    
    let filteredData = [...originalSurplusData];
    
    // If no data, return original
    if (filteredData.length === 0) {
      return;
    }
    
    switch (filterType) {
      case 'Nearest':
        // Sort by distance - closest first
        filteredData = filteredData.sort((a, b) => {
          const distanceA = parseFloat(a.distance) || 999;
          const distanceB = parseFloat(b.distance) || 999;
          return distanceA - distanceB;
        });
        break;
        
      case 'Iconic':
        // Filter restaurants with decent ratings, reviews, or popular brands (more lenient)
        filteredData = filteredData.filter(restaurant => {
          const rating = parseFloat(restaurant.avgrating) || 0;
          const reviewCount = parseInt(restaurant.reviewCount) || 0;
          const name = restaurant.Name?.toLowerCase() || '';
          
          // Consider restaurants iconic if they have:
          // 1. Decent rating (3.5+) AND some reviews (5+)
          // 2. Any restaurants with reviews (fallback)
          // 3. Popular brand names
          const isRatedWithReviews = rating >= 3.5 && reviewCount >= 5;
          const hasAnyReviews = reviewCount > 0;
          const isPopularBrand = name.includes('mcdonald') || 
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
        
        // If no results, show all restaurants
        if (filteredData.length === 0) {
          filteredData = [...originalSurplusData];
        }
        break;
        
      case 'Rating':
        // Sort by highest rating first, then by review count
        filteredData = filteredData.sort((a, b) => {
          const ratingA = parseFloat(a.avgrating) || 0;
          const ratingB = parseFloat(b.avgrating) || 0;
          const reviewCountA = parseInt(a.reviewCount) || 0;
          const reviewCountB = parseInt(b.reviewCount) || 0;
          
          // Primary sort by rating, secondary sort by review count
          if (ratingB !== ratingA) {
            return ratingB - ratingA;
          }
          return reviewCountB - reviewCountA;
        });
        break;
        
      case 'Deals':
        // Filter restaurants with deals (more lenient criteria)
        filteredData = filteredData.filter(restaurant => {
          const name = restaurant.Name?.toLowerCase() || '';
          const rating = parseFloat(restaurant.avgrating) || 0;
          const prepTime = restaurant.preparationTime || '';
          
          // Consider restaurants with deals if they have:
          // 1. Any preparation time mentioned (likely to have deals)
          // 2. Rating below 4.5 (might offer deals)
          // 3. Promotional keywords in name
          // 4. Fast food chains (likely to have deals)
          const hasAnyPrepTime = prepTime && prepTime.length > 0;
          
          const hasRoomForDeals = rating > 0 && rating < 4.5;
          
          const hasPromoKeywords = name.includes('50% off') || 
                                  name.includes('discount') || 
                                  name.includes('deal') || 
                                  name.includes('promo') || 
                                  name.includes('special') ||
                                  name.includes('offer');
          
          const isFastFood = name.includes('mcdonald') || 
                            name.includes('kfc') || 
                            name.includes('domino') || 
                            name.includes('subway') ||
                            name.includes('pizza');
          
          // Explicit deal fields (if they exist in API)
          const hasExplicitDeals = restaurant.hasDeals || 
                                  restaurant.discount || 
                                  restaurant.offer || 
                                  restaurant.promotion;
          
          return hasAnyPrepTime || hasRoomForDeals || hasPromoKeywords || hasExplicitDeals || isFastFood;
        });
        
        // If no results, show all restaurants
        if (filteredData.length === 0) {
          filteredData = [...originalSurplusData];
        }
        break;
        
      case 'Open Now':
        // Filter restaurants that are currently open
        filteredData = filteredData.filter(restaurant => {
          return restaurant.isOpen !== false; // Assume open unless specifically closed
        });
        
        if (filteredData.length === 0) {
          filteredData = [...originalSurplusData];
        }
        break;
        
      default:
        // Default to nearest
        filteredData = filteredData.sort((a, b) => {
          const distanceA = a.distance || 0;
          const distanceB = b.distance || 0;
          return distanceA - distanceB;
        });
    }
    
    // Always ensure we have data to show
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
    { id: '4', name: 'Burgers', icon: require('./assets/images/burgers.png') },
    { id: '5', name: 'Fast Food', icon: require('./assets/images/snacks.png') },
    { id: '6', name: 'Sandwiches', icon: require('./assets/images/sandwich.png') },
  ];

  // Carousel navigation functions
  const goToNextSlide = () => {
    if (currentSlide < surplusData.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      flatListRef.current?.scrollToIndex({ index: nextSlide, animated: true });
    }
  };

  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      const prevSlide = currentSlide - 1;
      setCurrentSlide(prevSlide);
      flatListRef.current?.scrollToIndex({ index: prevSlide, animated: true });
    }
  };

  const onScroll = event => {
    const slideSize = 296; // card width (280) + margin (16)
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentSlide(index);
  };

  const renderSurplusCard = ({ item, index }) => {
    const imageId = `surplus-${item.id}`;
    const imageUrl = item.imageUrl;
    const optimizedUrl = getOptimizedImageUrl(imageUrl, 300, 138);

    return (
      <TouchableOpacity style={styles.surplusCard} onPress={() => handleRestaurantPress(item)}>
        {/* Image with loading state */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: optimizedUrl,
            }}
            style={styles.surplusImage}
            resizeMode="cover"
            onLoadStart={() => handleImageLoadStart(imageId)}
            onLoadEnd={() => handleImageLoadEnd(imageId)}
            onError={() => handleImageError(imageId)}
          />
          {imageLoadingStates[imageId] === 'loading' && (
            <View style={styles.imageLoadingOverlay}>
              <ActivityIndicator size="small" color="#E53E3E" />
            </View>
          )}
        </View>

      {/* Left Navigation Arrow */}
      {currentSlide > 0 && (
        <TouchableOpacity
          style={styles.leftArrowContainer}
          onPress={goToPrevSlide}
        >
          <Icon name="chevron-back" size={16} color="#000" />
        </TouchableOpacity>
      )}

      {/* Right Navigation Arrow */}
      {currentSlide < surplusData.length - 1 && (
        <TouchableOpacity
          style={styles.rightArrowContainer}
          onPress={goToNextSlide}
        >
          <Icon name="chevron-forward" size={16} color="#000" />
        </TouchableOpacity>
      )}

      {/* Top overlay */}
      <View style={styles.surplusTopOverlay}>
        <Text style={styles.bagsLeftText}>{item.bagsLeft || '0'} Bags Left</Text>
        <TouchableOpacity style={styles.heartIconContainer}>
          <Icon name="heart" size={16} color="red" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.surplusContentBox}>
        <Text style={styles.surplusName} numberOfLines={1}>
          {item.Name}
        </Text>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingValue}>{item.avgrating || '4.5'}</Text>
          <Text style={styles.ratingDots}>• • •</Text>
        </View>
        <Text style={styles.detailText}>
          {item.preparationTime || '5-10 min'} |{' '}
          {item.distance?.toFixed(1) || '3.9'} miles
        </Text>
        <Text style={styles.pickupTime}>Pickup Time: {item.pickupTime || 'Call for hours'}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRestaurantCard = ({ item }) => {
    const imageId = `restaurant-${item.id}`;
    const optimizedUrl = getOptimizedImageUrl(item.imageUrl, 350, 180);

    return (
      <TouchableOpacity style={styles.restaurantCard} onPress={() => handleRestaurantPress(item)}>
        {/* Restaurant Image */}
        <View style={styles.restaurantImageContainer}>
          <Image
            source={{
              uri: optimizedUrl,
            }}
            style={styles.restaurantImage}
            resizeMode="cover"
            onLoadStart={() => handleImageLoadStart(imageId)}
            onLoadEnd={() => handleImageLoadEnd(imageId)}
            onError={() => handleImageError(imageId)}
          />
          {imageLoadingStates[imageId] === 'loading' && (
            <View style={styles.restaurantImageLoadingOverlay}>
              <ActivityIndicator size="medium" color="#E53E3E" />
            </View>
          )}
        </View>

      {/* Heart Icon */}
      <TouchableOpacity style={styles.restaurantHeartContainer}>
        <Icon name="heart-outline" size={20} color="#666" />
      </TouchableOpacity>

      {/* Offer Badge */}
      <View style={styles.offerBadge}>
        <Text style={styles.offerText}>{item.offer || 'Special Deal'}</Text>
      </View>

      {/* Restaurant Info */}
      <View style={styles.restaurantInfo}>
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName}>{item.Name}</Text>
          <View style={styles.restaurantRating}>
            <Text style={styles.ratingText}>{item.avgrating || '4.5'}</Text>
          </View>
        </View>
        <Text style={styles.restaurantTiming}>
          {item.preparationTime || '5-10 min'} |{' '}
          {item.distance?.toFixed(1) || '3.9'} miles
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMenuItemCard = ({ item }) => (
    <View style={styles.menuItemCard}>
      <View style={styles.menuItemInfo}>
        <Text style={styles.menuItemName}>{item.name || item.itemName || 'Menu Item'}</Text>
        <Text style={styles.menuItemPrice}>₹ {item.price || '0.00'}</Text>
        <Text style={styles.menuItemDescription}>
          {item.description || item.details || 'Delicious menu item'}
        </Text>
        <View style={styles.menuItemActions}>
          <TouchableOpacity style={styles.favoriteButton}>
            <Icon name="heart-outline" size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Icon name="share-outline" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.menuItemImageContainer}>
        <Image
          source={{
            uri: getOptimizedImageUrl(item.imageUrl || item.image, 80, 80),
          }}
          style={styles.menuItemImage}
          resizeMode={Image.resizeMode.cover}
        />
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

   const renderFilteredRestaurantCard = ({ item }) => (
     <TouchableOpacity 
       style={styles.filteredRestaurantCard}
       onPress={() => handleRestaurantPress(item)}
     >
       <View style={styles.filteredRestaurantInfo}>
         <Text style={styles.filteredRestaurantName}>{item.Name}</Text>
         <View style={styles.filteredRestaurantRating}>
           <Text style={styles.filteredRatingText}>★ {item.avgrating}</Text>
           <Text style={styles.filteredReviewText}>({item.reviewCount} reviews)</Text>
         </View>
         <Text style={styles.filteredRestaurantDetails}>
           {item.preparationTime} | {item.distance?.toFixed(1)} miles
         </Text>
         <Text style={styles.filteredRestaurantType}>
           {item.restaurantType?.map(type => type.restaurentType).join(', ')}
         </Text>
         <View style={styles.filteredRestaurantActions}>
           <TouchableOpacity style={styles.favoriteButton}>
             <Icon name="heart-outline" size={16} color="#666" />
           </TouchableOpacity>
           <TouchableOpacity style={styles.shareButton}>
             <Icon name="share-outline" size={16} color="#666" />
           </TouchableOpacity>
         </View>
       </View>
       <View style={styles.filteredRestaurantImageContainer}>
         <Image
           source={{
             uri: getOptimizedImageUrl(item.imageUrl, 120, 120),
             priority: Image.priority.normal,
           }}
           style={styles.filteredRestaurantImage}
           resizeMode={Image.resizeMode.cover}
         />
         <View style={styles.filteredRestaurantBadge}>
           <Text style={styles.filteredBadgeText}>
             {selectedCategory?.name}
           </Text>
         </View>
       </View>
     </TouchableOpacity>
   );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.leftHeaderSection}>
          <View style={styles.coinsContainer}>
          <Image source={require('./assets/images/dollar.png')} style={styles.dollarIcon}/>
            <Text style={styles.coins}> {customerId || '0'}</Text>
          </View>
          <View style={styles.locationContainer}>
            <Image source={require('./assets/images/location-arrow.png')} style={styles.locationArrow} />
            <Text style={styles.locationText}>Home</Text>
            <Icon name="chevron-down" size={14} color="#666" />
          </View>
          <Text style={styles.address}>{userLocation.address || 'Location not set'}</Text>
        </View>
        <View style={styles.rightHeaderSection}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="notifications-outline" size={20} color="#00000082" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image source={require('./assets/images/megaphone.png')} style={styles.megaphone} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleSearchPress}>
            <Icon name="search-outline" size={20} color="#00000082" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(item)}
              >
                <Image source={item.icon} style={styles.categoryIcon} />
                <Text style={[
                  styles.categoryText,
                  activeCategoryId === item.id && styles.activeCategoryText
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.categoriesContent}
          />
        </View>

        {/* Filter Chips - Always Show */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            <TouchableOpacity
              style={[
                styles.filterChip, 
                activeFilter === 'Nearest' && styles.activeFilterChip
              ]}
              onPress={() => applyFilter('Nearest')}
            >
              <Text style={[
                styles.filterText, 
                activeFilter === 'Nearest' && styles.activeFilterText
              ]}>
                Nearest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterChip,
                activeFilter === 'Iconic' && styles.activeFilterChip
              ]}
              onPress={() => applyFilter('Iconic')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'Iconic' && styles.activeFilterText
              ]}>
                Iconic
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterChip,
                activeFilter === 'Rating' && styles.activeFilterChip
              ]}
              onPress={() => applyFilter('Rating')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'Rating' && styles.activeFilterText
              ]}>
                Rating
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterChip,
                activeFilter === 'Deals' && styles.activeFilterChip
              ]}
              onPress={() => applyFilter('Deals')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'Deals' && styles.activeFilterText
              ]}>
                Deals
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterChip,
                activeFilter === 'Open Now' && styles.activeFilterChip
              ]}
              onPress={() => applyFilter('Open Now')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'Open Now' && styles.activeFilterText
              ]}>
                Open Now
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Restaurant Menu - Show if Selected */}
        {showRestaurantMenu && selectedRestaurant && (
          <View style={styles.greekMenuContainer}>
            {/* Restaurant Header with Large Image */}
            <View style={styles.greekRestaurantHeader}>
              <TouchableOpacity style={styles.backButton} onPress={handleBackToFilters}>
                <Icon name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <View style={styles.greekRestaurantInfo}>
                <View style={styles.greekRestaurantDetails}>
                  <Text style={styles.greekRestaurantName}>{selectedRestaurant?.Name || 'Restaurant'}</Text>
                  <View style={styles.greekRestaurantRating}>
                    <Icon name="star" size={12} color="#FFD700" />
                    <Text style={styles.greekRatingText}>
                      {selectedRestaurant?.avgrating || '4.1'} ({selectedRestaurant?.reviewCount || '11'} reviews)
                    </Text>
                  </View>
                  <View style={styles.greekRestaurantTiming}>
                    <Icon name="time-outline" size={12} color="#666" />
                    <Text style={styles.greekTimingText}>
                      {selectedRestaurant?.preparationTime || '15-20 min'} | {selectedRestaurant?.distance?.toFixed(1) || '0.5'} miles
                    </Text>
                    <Icon name="search-outline" size={12} color="#666" style={{marginLeft: 10}} />
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.infoButton}>
                <Icon name="information-circle-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Large Restaurant Image */}
            <View style={styles.greekImageContainer}>
              <Image 
                source={{
                  uri: getOptimizedImageUrl(selectedRestaurant?.imageUrl, 350, 250),
                }} 
                style={styles.greekRestaurantLargeImage}
                resizeMode="cover"
              />
            </View>

            {/* Popular Section */}
            <View style={styles.popularSection}>
              <Text style={styles.popularTitle}>Popular</Text>
            </View>

            {/* Menu Items */}
            <FlatList
              data={restaurantMenuData?.data || []}
              keyExtractor={(item, index) => `menu-${index}`}
              renderItem={renderMenuItemCard}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.menuItemsList}
            />
          </View>
        )}

         {/* Category Filter Info - Show if Category Selected */}
         {selectedCategory && (
           <View style={styles.categoryFilterInfo}>
             <View style={styles.categoryFilterHeader}>
               <Text style={styles.categoryFilterText}>
                 Showing {selectedCategory.name} restaurants ({surplusData.length})
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

        {/* Promotional Banners */}
        <View style={styles.promoBanner}>
          <FlatList
            data={[
              {
                id: '1',
                image: require('./assets/images/promotionalbnr-1.png'),
              },
              {
                id: '2',
                image: require('./assets/images/promotionalbnr-2.png'),
              },
            ]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Image
                source={item.image}
                style={styles.promoImage}
                resizeMode="cover"
              />
            )}
            contentContainerStyle={styles.promoContent}
          />
        </View>

        {/* Surplus Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Surplus</Text>
          <TouchableOpacity onPress={() => setShowAllRestaurants(!showAllRestaurants)}>
            <Icon 
              name={showAllRestaurants ? "chevron-up" : "chevron-forward"} 
              size={18} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        {/* Dynamic Content - Surplus Cards or All Restaurants */}
        {!showAllRestaurants ? (
          <View style={styles.surplusCarouselContainer}>
            <FlatList
              ref={flatListRef}
              data={surplusData}
              keyExtractor={item => item.id.toString()}
              renderItem={renderSurplusCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.surplusContent}
              pagingEnabled
              snapToInterval={296} // card width (280) + margin (16)
              decelerationRate="fast"
              onScroll={onScroll}
              scrollEventThrottle={16}
              getItemLayout={(data, index) => ({
                length: 296,
                offset: 296 * index,
                index,
              })}
            />
          </View>
        ) : (
          <View style={styles.allRestaurantsContainer}>
            <FlatList
              data={allRestaurants}
              keyExtractor={item => `restaurant-${item.id}`}
              renderItem={renderRestaurantCard}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </ScrollView>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="heart-outline" size={24} color="#999" />
          <Text style={styles.navText}>Favourites</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
           <Image source={require('./assets/images/solidarity.png')} />
         
          <Text style={styles.navText}>Donation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItemCenter}>
          <View style={styles.centerIcon}>
            <Icon name="restaurant" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
            <Icon name="gift-outline" size={24} color="#999" />
          <Text style={styles.navText}>Gifts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Icon name="person-outline" size={24} color="#999" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffff',
    paddingTop: 20,
    
    
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
    
    backgroundColor: '#ffff',
    paddingVertical: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    backgroundColor: '#ffff',
  },
  filtersContainer: {
    marginBottom: 15,
    backgroundColor: '#ffff',
    
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
    color: '#ffff',
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
    width:100,
    
    
  },
  activeCategoryText: {
    color: '#E53E3E',
  },
  promoBanner: {
    marginBottom: 20,
  },
  promoContent: {
    paddingLeft: 16,
  },
  promoImage: {
    width: 340,
    height: 160,
    borderRadius: 6,
    marginRight: 16,
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
    backgroundColor: '#ffff',
    borderRadius: 16,
    width: 30,
    height: 30,
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
    borderRadius: 16,
    width: 30,
    height: 30,
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
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  ratingDots: {
    fontSize: 11,
    color: '#E53E3E',
    marginLeft: 6,
    fontWeight: 'bold',
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
    height: 222,
    width: 300,
    marginBottom: 20,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    padding: 16,
  },
  surplusName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E53E3E',
    backgroundColor: '#fff2f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pickupTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },

  // Restaurant Card Styles
  restaurantCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  restaurantHeartContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  offerBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#E53E3E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  offerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantRating: {
    backgroundColor: '#E53E3E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  restaurantTiming: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontWeight: '400',
  },
  
  // Bottom Navigation Styles
  bottomNavigation: {
    
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navItemCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    
  },
  centerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E53E3E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E53E3E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  dollarIcon:{
    width: 20,
    height: 20,
    marginLeft: -7,
  },
  locationArrow: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  
  // Greek Menu Styles
  greekMenuContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
  },
  greekRestaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  greekRestaurantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  greekImageContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  greekRestaurantLargeImage: {
    width: 350,
    height: 250,
    borderRadius: 12,
    alignSelf: 'center',
  },
  greekRestaurantDetails: {
    flex: 1,
  },
  greekRestaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  greekRestaurantRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  greekRatingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  greekRestaurantTiming: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greekTimingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  infoButton: {
    padding: 4,
  },
  popularSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  popularTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  menuItemsList: {
    paddingHorizontal: 16,
  },
  menuItemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E53E3E',
    marginBottom: 6,
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 8,
  },
  menuItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    marginRight: 16,
    padding: 4,
  },
  shareButton: {
    padding: 4,
  },
  menuItemImageContainer: {
    alignItems: 'center',
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#E53E3E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // National Picks Styles
  nationalPicksContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
  },
  nationalPicksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  nationalPicksHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nationalPicksDetails: {
    flex: 1,
  },
  nationalPicksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  nationalPicksSubtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  nationalPicksImageContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  nationalPicksLargeImage: {
    width: 350,
    height: 250,
    borderRadius: 12,
    alignSelf: 'center',
  },
  nationalPicksCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  nationalPicksCardInfo: {
    flex: 1,
    paddingRight: 12,
  },
  nationalPicksName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  nationalPicksDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 8,
  },
  nationalPicksActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nationalPicksImageContainer: {
    alignItems: 'center',
  },
  nationalPicksImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  viewButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
   viewButtonText: {
     color: '#fff',
     fontSize: 12,
     fontWeight: 'bold',
   },

   // Filtered Restaurant Styles
   filteredRestaurantsList: {
     paddingHorizontal: 16,
   },
   filteredRestaurantCard: {
     flexDirection: 'row',
     backgroundColor: '#fff',
     marginBottom: 16,
     borderRadius: 12,
     padding: 16,
     shadowColor: '#000',
     shadowOffset: {
       width: 0,
       height: 2,
     },
     shadowOpacity: 0.1,
     shadowRadius: 8,
     elevation: 4,
   },
   filteredRestaurantInfo: {
     flex: 1,
     paddingRight: 12,
   },
   filteredRestaurantName: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#000',
     marginBottom: 6,
   },
   filteredRestaurantRating: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 6,
   },
   filteredRatingText: {
     fontSize: 14,
     fontWeight: 'bold',
     color: '#E53E3E',
     marginRight: 6,
   },
   filteredReviewText: {
     fontSize: 12,
     color: '#666',
   },
   filteredRestaurantDetails: {
     fontSize: 12,
     color: '#666',
     marginBottom: 6,
   },
   filteredRestaurantType: {
     fontSize: 12,
     color: '#E53E3E',
     fontWeight: '600',
     marginBottom: 8,
   },
   filteredRestaurantActions: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   filteredRestaurantImageContainer: {
     alignItems: 'center',
     position: 'relative',
   },
   filteredRestaurantImage: {
     width: 120,
     height: 120,
     borderRadius: 12,
     marginBottom: 8,
   },
   filteredRestaurantBadge: {
     position: 'absolute',
     top: 8,
     right: 8,
     backgroundColor: '#E53E3E',
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 6,
   },
   filteredBadgeText: {
     color: '#fff',
     fontSize: 10,
     fontWeight: 'bold',
   },

   // Category Filter Info Styles
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
});