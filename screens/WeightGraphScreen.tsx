import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  RefreshControl,
} from 'react-native';
// ⭐️ Gas ke liye BarChart, Weight ke liye LineChart
import { BarChart, LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width - 32;

// 🎨 Common dark theme config
const commonChartConfig = {
  backgroundGradientFrom: 'rgba(255, 255, 255, 0.05)',
  backgroundGradientTo: 'rgba(255, 255, 255, 0.05)',
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
  propsForBackgroundLines: { // Faltu lines band
    stroke: 'rgba(255, 255, 255, 0.1)',
    strokeDasharray: '',
  },
  propsForDots: { // Dots ka style
    r: "4",
    strokeWidth: "2",
  }
};

export default function WeightGraphScreen() {
  const [gasHistory, setGasHistory] = useState<number[]>([]);
  const [weightHistory, setWeightHistory] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🔹 Data load function
  const loadData = async () => {
    !refreshing && setIsLoading(true);
    try {
      const storedGas = await AsyncStorage.getItem('gasHistory');
      const storedWeight = await AsyncStorage.getItem('weightHistory');

      const parsedGas = storedGas ? JSON.parse(storedGas) : [];
      const parsedWeight = storedWeight ? JSON.parse(storedWeight) : [];

      setGasHistory(Array.isArray(parsedGas) ? parsedGas : []);
      setWeightHistory(Array.isArray(parsedWeight) ? parsedWeight : []);

    } catch (err) {
      console.error("Failed to load history:", err);
      setGasHistory([]);
      setWeightHistory([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // 🔹 Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, []);

  // 🔹 Focus par reload
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // ⭐️ NAYA: Data ko title mein dikhane ke liye
  const latestGas = gasHistory.length > 0 ? `${gasHistory[gasHistory.length - 1].toFixed(0)}%` : 'N/A';
  const latestWeight = weightHistory.length > 0 ? `${weightHistory[weightHistory.length - 1].toFixed(2)} kg` : 'N/A';


  // 🔹 Graph Data Prepare (No X-axis labels)
  const gasChartData = useMemo(() => ({
    labels: [], // Labels hata diye, graph saaf dikhega
    datasets: [{ data: gasHistory.length > 0 ? gasHistory : [0] }],
  }), [gasHistory]);

  const weightChartData = useMemo(() => ({
    labels: [], // Labels hata diye
    datasets: [{ data: weightHistory.length > 0 ? weightHistory : [0] }],
  }), [weightHistory]);

  
  // ⭐️ Helper: Gas Chart (Ab yeh BarChart hai)
  const renderGasChart = () => {
    if (isLoading && !refreshing) return <ActivityIndicator size="large" color="#FFFFFF" style={{ height: 250 }} />;
    if (gasHistory.length < 2)
      return (
        <View style={styles.emptyGraph}>
          <Icon name="chart-bar-stacked" size={50} color="#888" />
          <Text style={styles.emptyGraphText}>Waiting for Gas Data...</Text>
        </View>
      );

    return (
      <BarChart
        data={gasChartData}
        width={screenWidth}
        height={250}
        chartConfig={{
          ...commonChartConfig,
          color: (opacity = 1) => `rgba(0, 150, 136, ${opacity})`, // Teal
        }}
        yAxisSuffix=" %"
        yAxisLabel=""
        fromZero={true}
        withHorizontalLines={false}
        withVerticalLines={false}
        showValuesOnTopOfBars={true} // ⭐️ YEH RAHA "Data dikhao" WALA FIX
        style={styles.graphStyle}
      />
    );
  };

  // ⭐️ Helper: Weight Chart (LineChart, BEHTAR)
  const renderWeightChart = () => {
    if (isLoading && !refreshing) return <ActivityIndicator size="large" color="#FFFFFF" style={{ height: 250 }} />;
    if (weightHistory.length < 2)
      return (
        <View style={styles.emptyGraph}>
          <Icon name="weight-kilogram" size={50} color="#888" />
          <Text style={styles.emptyGraphText}>Waiting for Weight Data...</Text>
        </View>
      );

    return (
      <LineChart
        data={weightChartData}
        width={screenWidth} // Thoda adjust
        height={250}
        chartConfig={{
          ...commonChartConfig,
          color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})`, // Yellow
          strokeWidth: 3,
          propsForDots: {
            ...commonChartConfig.propsForDots,
            stroke: "#FFFFFF", // Dots ko alag highlight
          }
        }}
        yAxisSuffix=" kg"
        yAxisLabel=""
        bezier // Smooth line
        withShadow={true} // Shadow
        withHorizontalLines={true} // Isme lines acchi lagengi
        withVerticalLines={false}
        fromZero={false} // ⭐️ YEH HAI SABSE ZAROORI FIX
        style={styles.graphStyle}
      />
    );
  };

  // 🎨 Main loading state
  if (isLoading && !refreshing) {
    return (
       <LinearGradient colors={['#000428', '#004e92']} style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loaderText}>Loading Analytics...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000428', '#004e92']} style={StyleSheet.absoluteFillObject} />
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
        }
      >
        <Text style={styles.title}>Analytics Dashboard</Text>

        {/* GAS GRAPH */}
        <Text style={styles.sectionTitle}>
          Recent Gas Sensor (Latest: <Text style={styles.latestValueText}>{latestGas}</Text>)
        </Text>
        <View style={styles.chartContainer}>{renderGasChart()}</View>

        {/* WEIGHT GRAPH */}
        <Text style={styles.sectionTitle}>
          Cylinder Weight (Latest: <Text style={styles.latestValueText}>{latestWeight}</Text>)
        </Text>
        <View style={styles.chartContainer}>{renderWeightChart()}</View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Icon name="information-outline" size={24} color="#FFA000" />
          <View style={styles.infoTextBox}>
            <Text style={styles.infoText}>Pull down to refresh data.</Text>
            <Text style={styles.infoSubText}>
              Graphs show the last 10 readings saved locally from your device.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000428' },
  loaderContainer: { // Loader ke liye
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: { // Loader ke liye
    color: '#ccc',
    marginTop: 10,
    fontSize: 16,
  },
  scrollContainer: { padding: 16, paddingBottom: 30 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
    marginTop: 10,
  },
  latestValueText: { // ⭐️ NAYA STYLE
    color: '#FFA000', // Yellow
    fontWeight: '800',
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
    marginBottom: 15,
  },
  graphStyle: { borderRadius: 16 },
  emptyGraph: { 
    height: 250, // Fixed height
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  emptyGraphText: { color: '#aaa', marginTop: 15, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  infoBox: {
    marginTop: 15,
    backgroundColor: 'rgba(255, 248, 225, 0.1)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderColor: '#FFA000',
    borderWidth: 1,
  },
  infoTextBox: { flex: 1, marginLeft: 12 },
  infoText: { fontSize: 15, color: '#FFF8E1', fontWeight: '600', lineHeight: 22 },
  infoSubText: { fontSize: 13, color: '#E0E0E0', opacity: 0.8, marginTop: 8, lineHeight: 18 },
});