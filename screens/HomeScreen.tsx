import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

// 'navigation: any' likh rahe hain simplicity ke liye
export default function HomeScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
      
      <Button
        title="going to Info Page"
        onPress={() => navigation.navigate('Info')} // 'Info' naam se InfoScreen ko call karega
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  }
});