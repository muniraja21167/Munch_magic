const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
let posts = [
  { id: 1, title: "Welcome Post", body: "This is the first post" },
  { id: 2, title: "Second Post", body: "This is the second post" }
];

let users = [
  { id: 1, username: "admin", password: "password", token: "demo-token-123" },
  { id: 2, username: "user", password: "123456", token: "demo-token-456" }
];

// Mock restaurants data
let restaurants = [
  {
    _id: "1",
    name: "McDonald's",
    description: "Fast food restaurant serving burgers, fries, and more",
    rating: 4.2,
    category: "Fast Food",
    image: "https://i.ibb.co/4fJ8K2x/mcdonalds.jpg"
  },
  {
    _id: "2", 
    name: "Pizza Hut",
    description: "Pizza delivery and dine-in restaurant",
    rating: 4.5,
    category: "Pizza",
    image: "https://i.ibb.co/5K8Q9Lx/pizzahut.jpg"
  },
  {
    _id: "3",
    name: "KFC",
    description: "Fried chicken and sides restaurant",
    rating: 4.1,
    category: "Fast Food", 
    image: "https://i.ibb.co/3yJ7K9x/kfc.jpg"
  },
  {
    _id: "4",
    name: "Subway",
    description: "Fresh sandwiches and salads",
    rating: 4.3,
    category: "Sandwiches",
    image: "https://i.ibb.co/2vJ8K2x/subway.jpg"
  },
  {
    _id: "5",
    name: "Starbucks",
    description: "Coffee and light snacks",
    rating: 4.4,
    category: "Coffee",
    image: "https://i.ibb.co/4fJ8K2x/starbucks.jpg"
  },
  {
    _id: "6",
    name: "Burger King",
    description: "Flame-grilled burgers and fries",
    rating: 4.0,
    category: "Fast Food",
    image: "https://i.ibb.co/5K8Q9Lx/burgerking.jpg"
  },
  {
    _id: "7",
    name: "Taco Bell",
    description: "Mexican-inspired fast food",
    rating: 3.9,
    category: "Mexican",
    image: "https://i.ibb.co/3yJ7K9x/tacobell.jpg"
  },
  {
    _id: "8",
    name: "Domino's",
    description: "Pizza delivery and carryout",
    rating: 4.2,
    category: "Pizza",
    image: "https://i.ibb.co/2vJ8K2x/dominos.jpg"
  },
  {
    _id: "9",
    name: "Chipotle",
    description: "Mexican grill with fresh ingredients",
    rating: 4.6,
    category: "Mexican",
    image: "https://i.ibb.co/4fJ8K2x/chipotle.jpg"
  },
  {
    _id: "10",
    name: "Panera Bread",
    description: "Bakery-cafe with soups, salads, and sandwiches",
    rating: 4.3,
    category: "Bakery",
    image: "https://i.ibb.co/5K8Q9Lx/panera.jpg"
  }
];

// Mock surplus data with 4 restaurants for surplus section
let surplusData = [
  {
    id: 20,
    Name: "Wingstop",
    latitude: "12.9135943",
    longitude: "77.6345245",
    imageUrl: "https://munch-n-give-app.s3.amazonaws.com/Restaurant/Dominos.png",
    preparationTime: "15-20 min",
    avgrating: "4.5",
    reviewCount: 138,
    distance: 1.2,
    description: "Wing restaurant chain serving bone-in & boneless wings plus sides",
    address: "123 Wings Street, Downtown",
    restaurantStatusId: 1,
    restaurantStatus: "Active",
    favourite: [],
    restaurantOffers: [],
    munchMagicAdminOffer: [],
    restaurantType: [],
    restaurantTiming: [],
    restaurantOperationStatus: true,
    restaurantOpeningStatus: true
  },
  {
    id: 21,
    Name: "Barrique Version",
    latitude: "12.9230384",
    longitude: "77.64426", 
    imageUrl: "https://munch-n-give-app.s3.amazonaws.com/Restaurant/Mustardfoodcourt.png",
    preparationTime: "8-10 min",
    avgrating: "4.2",
    reviewCount: 127,
    distance: 0.8,
    description: "BBQ restaurant with smoky flavors and grilled specialties",
    address: "456 BBQ Lane, Midtown",
    restaurantStatusId: 1,
    restaurantStatus: "Active",
    favourite: [],
    restaurantOffers: [],
    munchMagicAdminOffer: [],
    restaurantType: [],
    restaurantTiming: [],
    restaurantOperationStatus: true,
    restaurantOpeningStatus: true
  },
  {
    id: 22,
    Name: "Pizza Palace",
    latitude: "12.9230384",
    longitude: "77.64426",
    imageUrl: "https://munch-n-give-app.s3.amazonaws.com/last.png", 
    preparationTime: "20-25 min",
    avgrating: "4.3",
    reviewCount: 95,
    distance: 1.5,
    description: "Authentic Italian pizza with fresh ingredients",
    address: "789 Pizza Avenue, Uptown",
    restaurantStatusId: 1,
    restaurantStatus: "Active", 
    favourite: [],
    restaurantOffers: [],
    munchMagicAdminOffer: [],
    restaurantType: [],
    restaurantTiming: [],
    restaurantOperationStatus: true,
    restaurantOpeningStatus: true
  },
  {
    id: 23,
    Name: "Burger Joint",
    latitude: "12.9230384",
    longitude: "77.64426",
    imageUrl: "https://munch-n-give-app.s3.amazonaws.com/Restaurant/Dominos.png", 
    preparationTime: "12-18 min",
    avgrating: "4.1",
    reviewCount: 82,
    distance: 1.8,
    description: "Gourmet burgers with premium ingredients and fresh fries",
    address: "321 Burger Street, West Side",
    restaurantStatusId: 1,
    restaurantStatus: "Active", 
    favourite: [],
    restaurantOffers: [],
    munchMagicAdminOffer: [],
    restaurantType: [],
    restaurantTiming: [],
    restaurantOperationStatus: true,
    restaurantOpeningStatus: true
  }
];

// Routes
// GET /posts - Get all posts
app.get('/posts', (req, res) => {
  res.json(posts);
});

// POST /posts - Create a new post
app.post('/posts', (req, res) => {
  const { title, body } = req.body;
  const newPost = {
    id: posts.length + 1,
    title,
    body
  };
  posts.push(newPost);
  res.status(201).json(newPost);
});

// PUT /posts/:id - Update a post
app.put('/posts/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, body } = req.body;
  const postIndex = posts.findIndex(p => p.id === id);
  
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  posts[postIndex] = { ...posts[postIndex], title, body };
  res.json(posts[postIndex]);
});

// DELETE /posts/:id - Delete a post
app.delete('/posts/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const postIndex = posts.findIndex(p => p.id === id);
  
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  posts.splice(postIndex, 1);
  res.status(204).send();
});

// GET /users - Get users (for login)
app.get('/users', (req, res) => {
  const { username, password } = req.query;
  
  if (username && password) {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      return res.json([user]);
    }
    return res.json([]);
  }
  
  res.json(users);
});

// GET /api/restaurants - Get all restaurants
app.get('/api/restaurants', (req, res) => {
  res.json(restaurants);
});

// GET /api/surplus - Get surplus data
app.get('/api/surplus', (req, res) => {
  res.json(surplusData);
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'REST API Server is running!', posts: posts.length, users: users.length });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 For Android emulator, use: http://10.0.2.2:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET    /posts`);
  console.log(`   POST   /posts`);
  console.log(`   PUT    /posts/:id`);
  console.log(`   DELETE /posts/:id`);
  console.log(`   GET    /users?username=...&password=...`);
  console.log(`   GET    /api/restaurants`);
  console.log(`   GET    /api/surplus`);
});
