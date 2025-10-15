import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "./src/components/SplashScreen";
import LoginScreen from "./src/components/LoginScreen";   
import SignUpScreen from "./src/components/SignUpScreen"; 
import OtpScreen from "./src/components/OtpScreen";
import HomeScreen from "./src/components/HomeScreen";
import SearchScreen from "./src/components/SearchScreen";
import RestaurantDetailScreen from "./src/components/RestaurantDetailScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />  
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="OtpScreen" component={OtpScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
        <Stack.Screen name="RestaurantDetailScreen" component={RestaurantDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
