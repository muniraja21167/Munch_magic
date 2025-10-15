import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = require('react-native').Dimensions.get('window');

export default function SearchScreen({ navigation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Recent searches data
  const recentSearches = ['Pizza', 'Fast Food', 'Burgers', 'Nachos'];
  
  // Filter options data
  const filterOptions = [
    'Gluten-free', 'Halal', 'Healthy', 'Keto', 'Latin American', 
    'Low Carb', 'Low Sugar', 'Paleo', 'Vegan', 'Vegetarian'
  ];

  // Create demo data based on search term
  const createDemoSearchResults = (searchTerm) => {
    const term = searchTerm.toLowerCase();
    const baseItems = [];
    
    if (term.includes('piz') || term.includes('pizza')) {
      baseItems.push(
        { menuId: 1, menuName: 'Margherita Pizza', category: 'Pizza', description: 'Classic pizza with tomato, mozzarella, and fresh basil', amount: '299', imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=300&fit=crop' },
        { menuId: 2, menuName: 'Pepperoni Pizza', category: 'Pizza', description: 'Pizza topped with pepperoni and cheese', amount: '349', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=300&fit=crop' },
        { menuId: 3, menuName: 'Veggie Supreme Pizza', category: 'Pizza', description: 'Loaded with fresh vegetables and cheese', amount: '399', imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=300&h=300&fit=crop' }
      );
    }
    
    if (term.includes('bur') || term.includes('burger')) {
      baseItems.push(
        { menuId: 4, menuName: 'Classic Burger', category: 'Burgers', description: 'Juicy beef patty with lettuce, tomato, and cheese', amount: '249', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop' },
        { menuId: 5, menuName: 'Chicken Burger', category: 'Burgers', description: 'Grilled chicken breast with fresh vegetables', amount: '229', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=300&fit=crop' },
        { menuId: 6, menuName: 'Veggie Burger', category: 'Burgers', description: 'Plant-based patty with fresh toppings', amount: '199', imageUrl: 'https://images.unsplash.com/photo-1525059696034-4967a729002e?w=300&h=300&fit=crop' }
      );
    }
    
    if (term.includes('halal')) {
      baseItems.push(
        { menuId: 7, menuName: 'Halal Chicken Shawarma', category: 'Halal', description: 'Authentic halal chicken shawarma with garlic sauce', amount: '179', imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300&h=300&fit=crop' },
        { menuId: 8, menuName: 'Halal Beef Kebab', category: 'Halal', description: 'Grilled halal beef kebab with rice', amount: '329', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=300&fit=crop' }
      );
    }
    
    if (term.includes('healthy') || term.includes('keto')) {
      baseItems.push(
        { menuId: 9, menuName: 'Quinoa Salad Bowl', category: 'Healthy', description: 'Fresh quinoa with mixed vegetables and herbs', amount: '219', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop' },
        { menuId: 10, menuName: 'Keto Avocado Bowl', category: 'Keto', description: 'Low-carb bowl with avocado, eggs, and greens', amount: '249', imageUrl: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=300&h=300&fit=crop' }
      );
    }
    
    // If no specific matches, return generic food items
    if (baseItems.length === 0) {
      baseItems.push(
        { menuId: 11, menuName: `${searchTerm} Special`, category: 'Food', description: `Delicious ${searchTerm} prepared fresh for you`, amount: '199', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=300&fit=crop' },
        { menuId: 12, menuName: `${searchTerm} Deluxe`, category: 'Food', description: `Premium ${searchTerm} with extra toppings`, amount: '249', imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=300&fit=crop' }
      );
    }
    
    return baseItems;
  };

  const fetchMenuSearchTerm = async (searchTerm) => {
    try {
      console.log('📡 Calling menu search API with term:', searchTerm);
      
      const requestBody = {
        restaurantId: 1,
        isAvailable: 1,
        searchTerm: searchTerm
      };
      
      console.log('🔍 Search Request Body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('http://18.219.192.152:3052/api/restaurantMenuSearchTerm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      console.log('🍔 Search Results:', JSON.stringify(data, null, 2));
      
      return data;
    } catch (error) {
      console.error('Search API Error:', error);
      throw error;
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔍 Searching for:', searchTerm);
      
      const searchData = await fetchMenuSearchTerm(searchTerm);
      
      if (searchData && searchData.success && searchData.data) {
        console.log('✅ SUCCESS: Search data loaded');
        console.log('🍽️ Search Response:', JSON.stringify(searchData, null, 2));
        
        // Handle the API response structure
        let allMenuItems = [];
        
        if (Array.isArray(searchData.data)) {
          // If data is directly an array of menu items
          allMenuItems = searchData.data;
        } else if (searchData.data.menu && Array.isArray(searchData.data.menu)) {
          // If data contains a menu array
          allMenuItems = searchData.data.menu;
        } else if (searchData.data.category && Array.isArray(searchData.data.category)) {
          // If data contains categories with menu items
          searchData.data.category.forEach(category => {
            if (category.menu && category.menu.length > 0) {
              allMenuItems = [...allMenuItems, ...category.menu];
            }
          });
        }
        
        console.log('📊 Total Menu Items Found:', allMenuItems.length);
        
        if (allMenuItems.length > 0) {
          console.log('🔍 First Menu Item Structure:', JSON.stringify(allMenuItems[0], null, 2));
          setSearchResults(allMenuItems);
        } else {
          console.log('❌ No menu items found');
          // Create demo data for development
          const demoResults = createDemoSearchResults(searchTerm);
          setSearchResults(demoResults);
        }
      } else {
        console.log('❌ FAILED: No search data received or invalid structure');
        // Create demo data for development
        const demoResults = createDemoSearchResults(searchTerm);
        setSearchResults(demoResults);
      }
    } catch (error) {
      console.log('💥 ERROR in search:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecentSearch = (term) => {
    setSearchTerm(term);
    
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleFilterSearch = (filter) => {
    setSearchTerm(filter);
    // Automatically search when filter is tapped
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const renderSearchResultItem = ({ item }) => {
    // Smart image selection based on menu name and category
    const getImageSource = () => {
      const menuName = (item.menuName || item.Name || '').toLowerCase();
      const category = (item.categoryName || item.category || '').toLowerCase();
      
      // Try S3 URL first, but immediately fallback on error
      const s3ImageUrl = item.imageUrl || item.image || item.Image;
      
      // Menu-specific image mapping
      if (menuName.includes('buffalo') && menuName.includes('chicken') && menuName.includes('spring')) {
        // Buffalo Chicken Spring Roll - specific combination
        return { uri: 'https://images.unsplash.com/photo-1563379091339-03246a5aa499?w=300&h=300&fit=crop&auto=format&q=75' };
      } else if (menuName.includes('lobster') || menuName.includes('bisque')) {
        return { uri: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=300&fit=crop&auto=format&q=75' };
      } else if (menuName.includes('philly') || menuName.includes('cheesesteak')) {
        return { uri: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=300&h=300&fit=crop&auto=format&q=75' };
      } else if (menuName.includes('spring-roll') || menuName.includes('spring roll') || menuName.includes('spring_roll')) {
        return { uri: 'https://images.unsplash.com/photo-1563379091339-03246a5aa499?w=300&h=300&fit=crop&auto=format&q=75' };
      } else if (menuName.includes('jalapeno') || menuName.includes('poppers')) {
        return { uri: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=300&fit=crop&auto=format&q=75' };
      } else if (menuName.includes('buffalo') && menuName.includes('chicken')) {
        return { uri: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=300&h=300&fit=crop&auto=format&q=75' };
      } else if (menuName.includes('bbq') && menuName.includes('chicken')) {
        return { uri: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300&h=300&fit=crop&auto=format&q=75' };
      }
      
      // First check if we have a valid S3 image URL
      if (s3ImageUrl && s3ImageUrl.trim() !== '') {
        return { uri: s3ImageUrl };
      }
      
      // Category-specific fallback images
      if (category.includes('pizza')) {
        return { uri: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=300&fit=crop&auto=format&q=75' };
      } else if (category.includes('burger')) {
        return { uri: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop&auto=format&q=75' };
      } else if (category.includes('sandwich') || category.includes('wrap')) {
        return { uri: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=300&h=300&fit=crop&auto=format&q=75' };
      } else if (category.includes('drink') || category.includes('beverage')) {
        return { uri: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=300&fit=crop&auto=format&q=75' };
      } else if (category.includes('salad')) {
        return { uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop&auto=format&q=75' };
      }
      
      // Default food image
      return { uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=300&fit=crop&auto=format&q=75' };
    };

    return (
      <TouchableOpacity style={styles.searchResultCard}>
        <Image 
          source={getImageSource()}
          style={styles.searchResultImage}
          resizeMode="cover"
          onError={(error) => {
            console.log('❌ Image load error for:', item.menuName || item.Name, error.nativeEvent?.error);
          }}
          onLoad={() => {
            console.log('✅ Image loaded for:', item.menuName || item.Name);
          }}
          defaultSource={{ uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=300&fit=crop&auto=format&q=75' }}
        />
        <View style={styles.searchResultInfo}>
          <Text style={styles.searchResultName}>{item.menuName || item.Name || 'Unknown Item'}</Text>
          <Text style={styles.searchResultCategory}>{item.categoryName || item.category || 'Food'}</Text>
          <Text style={styles.searchResultDescription} numberOfLines={2}>
            {item.description || 'No description available'}
          </Text>
          <Text style={styles.searchResultPrice}>${item.amount || '0'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            console.log('🔙 Back button pressed!');
            console.log('🧪 Testing navigation...');
            
           
            navigation.reset({
              index: 0,
              routes: [{ name: 'HomeScreen' }],
            });
            
            console.log('✅ Navigation reset called');
          }} 
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
        >
          <Icon name="chevron-back-outline" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
        <TextInput
            style={styles.searchInput}
          placeholder="Search"
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchIconButton}>
            <Icon name="search-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

     
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : searchResults.length > 0 ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Found {searchResults.length} items</Text>
          <FlatList
            data={searchResults}
            renderItem={renderSearchResultItem}
            keyExtractor={(item) => item.menuId.toString()}
            showsVerticalScrollIndicator={false}
            style={styles.resultsList}
          />
        </View>
      ) : (
        <ScrollView 
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Recent Search Section */}
          <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Search</Text>
        {recentSearches.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.listItem}
                onPress={() => handleRecentSearch(item)}
              >
                <Text style={styles.listItemText}>{item}</Text>
          </TouchableOpacity>
        ))}
          </View>

          {/* Filter Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Filter</Text>
            {filterOptions.map((filter, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.listItem}
                onPress={() => handleFilterSearch(filter)}
              >
                <Text style={styles.listItemText}>{filter}</Text>
          </TouchableOpacity>
        ))}
          </View>
      </ScrollView>
      )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'left',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  searchIconButton: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingTop: 8,
  },
  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemText: {
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  resultsList: {
    flex: 1,
  },
  searchResultCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  searchResultImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 16,
    backgroundColor: '#f8f8f8',
  },
  searchResultInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  searchResultCategory: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E6F3FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  searchResultDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  searchResultPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});