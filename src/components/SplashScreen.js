
import React, { useEffect } from "react";
import { View, Image, StyleSheet, StatusBar } from "react-native";

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    
    const timer = setTimeout(() => {
      navigation.replace("Login"); 
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#E50914" barStyle="light-content" />
      <View style={styles.logoContainer}>
     
        <Image
          source={require("./assets/images/munch.png")} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E50914",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    backgroundColor: "#E50914",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  logo: {
    width: 180,
    height: 180,
  },
});

export default SplashScreen;
