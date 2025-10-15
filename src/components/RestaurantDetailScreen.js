import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function RestaurantDetailScreen({ route, navigation }) {
  const { restaurant } = route.params;
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [quantities, setQuantities] = useState({});
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    fetchRestaurantMenu();
  }, []);

  const fetchRestaurantMenu = async () => {
    try {
      console.log('Fetching restaurant menu for:', restaurant.Name);
      const requestBody = {
        restaurantId: restaurant.id,
        latitude: '12.9234082',
        longitude: '77.6492223',
        customerId: 172,
      };

      const res = await fetch('http://18.219.192.152:3052/api/restaurantMenu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const json = await res.json();
      console.log('Restaurant menu data:', json);
      
      if (json.success && json.data && json.data.length > 0) {
        setMenuData(json.data[0]); 
      }
      setLoading(false);
    } catch (err) {
      console.log('Restaurant menu fetch error:', err);
      setLoading(false);
      Alert.alert('Error', 'Failed to load restaurant menu');
    }
  };

  const getUniqueCategories = () => {
    if (!menuData?.menu) return ['All'];
    const categories = ['All', ...new Set(menuData.menu.map(item => item.category))];
    return categories;
  };

  const getFilteredMenu = () => {
    if (!menuData?.menu) return [];
    if (selectedCategory === 'All') return menuData.menu;
    return menuData.menu.filter(item => item.category === selectedCategory);
  };

  const updateQuantity = (itemId, change) => {
    setQuantities(prev => {
      const currentQty = prev[itemId] || 0;
      const newQty = Math.max(0, currentQty + change);
      return { ...prev, [itemId]: newQty };
    });
  };

  const getQuantity = (itemId) => {
    return quantities[itemId] || 0;
  };

  const handleInfoPress = () => {
    setShowDescription(!showDescription);
  };

  const renderSizeOption = ({ item: size }) => (
    <TouchableOpacity style={styles.sizeOption}>
      <Text style={styles.sizeText}>{size.size}</Text>
      <Text style={styles.sizePriceText}>₹{size.price}</Text>
    </TouchableOpacity>
  );

  const renderTopping = ({ item: topping }) => (
    <View style={styles.toppingItem}>
      <Text style={styles.toppingName}>{topping.subAddOn}</Text>
      <Text style={styles.toppingPrice}>+₹{topping.AddOnAmount}</Text>
    </View>
  );

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItemContainer}>
    
      <View style={styles.menuItemHeader}>
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.Name}</Text>
          <Text style={styles.menuItemPrice}>₹{item.amount}</Text>
          <Text style={styles.menuItemDescription}>{item.description}</Text>
          
         
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.heartButton}>
              <Icon name="heart-outline" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButtonItem}>
              <Icon name="share-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Image on Right Side */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageUrl || 'https://via.placeholder.com/120x120' }}
            style={styles.menuItemImage}
          />
          
          {/* Conditional Controls */}
          {getQuantity(item.id) === 0 ? (
            /* Show Add Button Initially */
            <TouchableOpacity 
              style={styles.addButtonOverlay}
              onPress={() => updateQuantity(item.id, 1)}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          ) : (
            /* Show Quantity Selector After Adding */
            <View style={styles.quantitySelectorOverlay}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => updateQuantity(item.id, -1)}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{getQuantity(item.id)}</Text>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => updateQuantity(item.id, 1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

    </View>
  );

  const renderCategoryFilter = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryFilter,
        selectedCategory === item && styles.activeCategoryFilter
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text style={[
        styles.categoryFilterText,
        selectedCategory === item && styles.activeCategoryFilterText
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading restaurant menu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.favoriteButton}>
            <Icon name="heart-outline" size={24} color="#E53E3E" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Icon name="share-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Large Restaurant Image */}
      <View style={styles.largeImageContainer}>
        <Image
          source={{ uri: restaurant.imageUrl }}
          style={styles.largeRestaurantImage}
        />
      </View>

      {/* Restaurant Info Below Image */}
      <View style={styles.restaurantInfoContainer}>
        <Text style={styles.restaurantName}>{restaurant.Name}</Text>
        
        <View style={styles.ratingRow}>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#E53E3E" />
            <Text style={styles.ratingText}>{restaurant.avgrating} ({restaurant.reviewCount} reviews)</Text>
          </View>
          <TouchableOpacity style={styles.infoButton} onPress={handleInfoPress}>
            <Icon name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.infoText}>Info</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.timingRow}>
          <Icon name="time-outline" size={16} color="#666" />
          <Text style={styles.timingText}>{restaurant.preparationTime}</Text>
          <Text style={styles.separator}>|</Text>
          <Text style={styles.distanceText}>{restaurant.distance?.toFixed(1)} miles</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Icon name="search-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        {/* Restaurant Description - Show/Hide on Info Press */}
        {showDescription && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>About {restaurant.Name}</Text>
            <Text style={styles.descriptionText}>{restaurant.description}</Text>
            <Text style={styles.addressText}>{restaurant.address}</Text>
          </View>
        )}
        
        <Text style={styles.popularText}>Popular</Text>
      </View>

      {/* Category Filters */}
      <View style={styles.categoryFiltersContainer}>
        <FlatList
          data={getUniqueCategories()}
          renderItem={renderCategoryFilter}
          keyExtractor={(item, index) => `category-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFiltersContent}
        />
      </View>

      {/* Menu Items */}
      <FlatList
        data={getFilteredMenu()}
        renderItem={renderMenuItem}
        keyExtractor={(item, index) => `menu-${item.id}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 4,
    marginRight: 12,
  },
  shareButton: {
    padding: 4,
  },
  largeImageContainer: {
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  largeRestaurantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  restaurantInfoContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  separator: {
    marginHorizontal: 8,
    fontSize: 14,
    color: '#666',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
  },
  searchButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  popularText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  descriptionContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginVertical: 12,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  categoryFiltersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryFiltersContent: {
    paddingHorizontal: 16,
  },
  categoryFilter: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  activeCategoryFilter: {
    backgroundColor: '#E53E3E',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeCategoryFilterText: {
    color: '#fff',
  },
  menuContent: {
    padding: 16,
  },
  menuItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  menuItemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  menuItemCategory: {
    fontSize: 12,
    color: '#E53E3E',
    marginBottom: 4,
    fontWeight: '600',
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E53E3E',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  heartButton: {
    marginRight: 16,
    padding: 4,
  },
  shareButtonItem: {
    padding: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  menuItemImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  quantitySelectorOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#E53E3E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sizesContainer: {
    marginBottom: 8,
  },
  toppingsContainer: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  sizesContent: {
    paddingVertical: 4,
  },
  sizeOption: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  sizePriceText: {
    fontSize: 12,
    color: '#E53E3E',
    marginTop: 2,
  },
  toppingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  toppingName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  toppingPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E53E3E',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
    padding: 2,
  },
  quantityButton: {
    backgroundColor: '#E53E3E',
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quantityText: {
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    minWidth: 16,
    textAlign: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
