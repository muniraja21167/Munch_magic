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
  const updateUserLocation = (latitude, longitude, address) => {
    setUserLocation({ latitude, longitude, address });
    fetchRestaurantsData();
  };

  // Function to update customer ID
  const updateCustomerId = (newCustomerId) => {
    setCustomerId(newCustomerId);
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
      console.error('Error fetching restaurants:', err);
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
    setActiveCategoryId(null);
  };

  const handleSearchPress = () => {
    navigation.navigate('SearchScreen');
  };

  const handleCategoryPress = async (category) => {
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
        const filteredRestaurants = json.data.filter(restaurant => {
          if (restaurant.restaurantType && restaurant.restaurantType.length > 0) {
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
    setSurplusData(originalSurplusData);
    setAllRestaurants(originalSurplusData);
    setActiveCategoryId(null);
    setSelectedCategory(null);
    setCurrentSlide(0);
  };

  const applyFilter = (filterType) => {
    setActiveFilter(filterType);
    setCurrentSlide(0);
    
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
    { id: '4', name: 'Burgers', icon: require('./assets/images/burgers.png') },
    { id: '5', name: 'Fast Food', icon: require('./assets/images/snacks.png') },
    { id: '6', name: 'Sandwiches', icon: require('./assets/images/sandwich.png') },
  ];

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
    const slideSize = 296;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentSlide(index);
  };

  const renderSurplusCard = ({ item, index }) => {
    const imageId = `surplus-${item.id}`;
    const imageUrl = item.imageUrl;
    const optimizedUrl = getOptimizedImageUrl(imageUrl, 300, 138);

    return (
      <TouchableOpacity style={styles.surplusCard} onPress={() => handleRestaurantPress(item)}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: optimizedUrl }}
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

        {currentSlide > 0 && (
          <TouchableOpacity style={styles.leftArrowContainer} onPress={goToPrevSlide}>
            <Icon name="chevron-back" size={16} color="#000" />
          </TouchableOpacity>
        )}

        {currentSlide < surplusData.length - 1 && (
          <TouchableOpacity style={styles.rightArrowContainer} onPress={goToNextSlide}>
            <Icon name="chevron-forward" size={16} color="#000" />
          </TouchableOpacity>
        )}

        <View style={styles.surplusTopOverlay}>
          <Text style={styles.bagsLeftText}>{item.bagsLeft || '0'} Bags Left</Text>
          <TouchableOpacity style={styles.heartIconContainer}>
            <Icon name="heart" size={16} color="red" />
          </TouchableOpacity>
        </View>

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
  };

  const renderRestaurantCard = ({ item }) => {
    const imageId = `restaurant-${item.id}`;
    const optimizedUrl = getOptimizedImageUrl(item.imageUrl, 350, 180);

    return (
      <TouchableOpacity style={styles.restaurantCard} onPress={() => handleRestaurantPress(item)}>
        <View style={styles.restaurantImageContainer}>
          <Image
            source={{ uri: optimizedUrl }}
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

        <TouchableOpacity style={styles.restaurantHeartContainer}>
          <Icon name="heart-outline" size={20} color="#666" />
        </TouchableOpacity>

        <View style={styles.offerBadge}>
          <Text style={styles.offerText}>{item.offer || 'Special Deal'}</Text>
        </View>

        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantHeader}>
            <Text style={styles.restaurantName}>{item.Name}</Text>
            <View style={styles.restaurantRating}>
              <Text style={styles.ratingText}>{item.avgrating || '4.5'}</Text>
            </View>
          </View>
          <Text style={styles.restaurantTiming}>
            {item.preparationTime || '5-10 min'} |{' '}
            {item.distance?.toFixed(1) || '3.9'} mile
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

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
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

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
            {['Nearest', 'Iconic', 'Rating', 'Deals', 'Open Now'].map(filter => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
                onPress={() => applyFilter(filter)}
              >
                <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedCategory && (
          <View style={styles.categoryFilterInfo}>
            <View style={styles.categoryFilterHeader}>
              <Text style={styles.categoryFilterText}>
                Showing {selectedCategory.name} restaurants ({surplusData.length})
              </Text>
              <TouchableOpacity style={styles.clearFilterButton} onPress={handleClearCategoryFilter}>
                <Text style={styles.clearFilterText}>Show All</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.promoBanner}>
          <FlatList
            data={[
              { id: '1', image: require('./assets/images/promotionalbnr-1.png') },
              { id: '2', image: require('./assets/images/promotionalbnr-2.png') },
            ]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Image source={item.image} style={styles.promoImage} resizeMode="cover" />
            )}
            contentContainerStyle={styles.promoContent}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Surplus</Text>
          <TouchableOpacity onPress={() => setShowAllRestaurants(!showAllRestaurants)}>
            <Icon name={showAllRestaurants ? "chevron-up" : "chevron-forward"} size={18} color="#666" />
          </TouchableOpacity>
        </View>

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
              snapToInterval={296}
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
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
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
  restaurantCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 1 },
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
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
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
    shadowOffset: { width: 0, height: 4 },
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
});
