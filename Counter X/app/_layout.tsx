import 'react-native-reanimated';
import { Vibration } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native';
import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Button, Alert} from 'react-native';
import CircularCounter from '../components/counter';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'react-native';

interface CounterState {
  id: string;
  count: number;
  counterName: string;
  lapLimit: number;
}

const COUNTERS_KEY = 'countersData';

export default function RootLayout() {
  const [counters, setCounters] = useState<CounterState[]>([]);
  const [activeCounter, setActiveCounter] = useState<CounterState | null>(null);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newCounterName, setNewCounterName] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editedCounter, setEditedCounter] = useState<CounterState | null>(null);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [themeIndex, setThemeIndex] = useState(0);

const colorThemes = [
  { bg: '#FFFFFF', text: '#000000' }, // Light Mode
  { bg: '#000000', text: '#FFFFFF' }, // Dark Mode
  { bg: '#000000', text: '#FF0000' }, // Neon Red
  { bg: '#000000', text: '#FFFF00' }, // Neon Yellow
  { bg: '#000000', text: '#FFA500' }, // Neon Orange
  { bg: '#000000', text: '#FF00FF' }, // Neon Pink
  { bg: '#000000', text: '#00FFFF' }, // Neon Cyan
  { bg: '#000000', text: '#39FF14' }, // Neon Green
  { bg: '#1a001a', text: '#FF1493' }, // Deep Purple with Hot Pink
  { bg: '#000033', text: '#00FF99' }, // Deep Blue with Mint
  


];

const currentTheme = colorThemes[themeIndex];

const toggleTheme = () => {
  setThemeIndex((prevIndex) => (prevIndex + 1) % colorThemes.length);
};



  // Load counters on component mount
  useEffect(() => {
    const loadCounters = async () => {
      const savedCounters = await AsyncStorage.getItem(COUNTERS_KEY);
      if (savedCounters) {
        const parsedCounters: CounterState[] = JSON.parse(savedCounters);
        setCounters(parsedCounters);
        setActiveCounter(parsedCounters[0] || null);
      } else {
        const defaultCounter: CounterState = {
          id: `${Date.now()}`,
          counterName: 'Counter',
          count: 0,
          lapLimit: 100,
        };
        setCounters([defaultCounter]);
        setActiveCounter(defaultCounter);
        await AsyncStorage.setItem(COUNTERS_KEY, JSON.stringify([defaultCounter]));
      }
    };
    loadCounters();
  }, []);

  // Save counters to AsyncStorage
  const saveCounters = async (updatedCounters: CounterState[]) => {
    try {
      await AsyncStorage.setItem(COUNTERS_KEY, JSON.stringify(updatedCounters));
    } catch (error) {
      console.error('Error saving counters:', error);
    }
  };

  // Create a new counter
  const handleCreateCounter = () => {
    if (newCounterName.trim() === '') return;

    const newCounter: CounterState = {
      id: `${Date.now()}`,
      counterName: newCounterName,
      count: 0,
      lapLimit: 100,
    };
    const updatedCounters = [...counters, newCounter];
    setCounters(updatedCounters);
    saveCounters(updatedCounters);
    setNewCounterName('');
    setShowCreateModal(false);
  };

  // Select a counter
  const handleSelectCounter = (counter: CounterState) => {
    setActiveCounter(counter);
    setShowSidebar(false);
  };

  const handleEditCounter = () => {
    if (activeCounter) {
      setEditedCounter({ ...activeCounter });  // Copy the active counter data immediately
      setShowEditModal(true);  // Show the modal after setting the editedCounter
    }
  };

  // Handle saving the updated counter
  const handleSaveCounter = () => {
    if (editedCounter && activeCounter) {
      const updatedCounters = counters.map((counter) =>
        counter.id === activeCounter.id ? { ...editedCounter } : counter
      );
      setCounters(updatedCounters);
      saveCounters(updatedCounters);
      setActiveCounter(editedCounter);
      setShowEditModal(false);
    }
  };

  // Handle deleting the counter
  const handleDeleteCounter = () => {
    if (activeCounter) {
      const updatedCounters = counters.filter((counter) => counter.id !== activeCounter.id);
      setCounters(updatedCounters);
      saveCounters(updatedCounters);
      setActiveCounter(null);
      setShowEditModal(false);
    }
  };

  // Increase count
  const increaseCount = () => {
    if (!activeCounter) return;

    // Continue increasing even after lapLimit
    const newCount = activeCounter.count + 1;
    const updatedCounters = counters.map((counter) =>
      counter.id === activeCounter.id ? { ...counter, count: newCount } : counter
    );
    setCounters(updatedCounters);
    saveCounters(updatedCounters);
    setActiveCounter({ ...activeCounter, count: newCount });

    if (vibrationEnabled) {
      Vibration.vibrate(75); 
    }
  };

  const resetCount = () => {
    if (!activeCounter) return;
  
    // Show confirmation alert
    Alert.alert(
      "Are you sure?",
      "Do you want to reset the counter?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            // Reset count to 0
            const newCount = 0;
            const updatedCounters = counters.map((counter) =>
              counter.id === activeCounter.id
                ? { ...counter, count: newCount } // Reset only the count
                : counter
            );
  
            // Update the state and save the counters
            setCounters(updatedCounters);
            saveCounters(updatedCounters);
            setActiveCounter({ ...activeCounter, count: newCount });
          },
        },
      ]
    );
  };
  

  // Decrease count
  const decreaseCount = () => {
    if (!activeCounter) return;

    // Ensure count doesn't go below 0
    const newCount = activeCounter.count === 0 ? 0 : activeCounter.count - 1;
    const updatedCounters = counters.map((counter) =>
      counter.id === activeCounter.id ? { ...counter, count: newCount } : counter
    );
    setCounters(updatedCounters);
    saveCounters(updatedCounters);
    setActiveCounter({ ...activeCounter, count: newCount });
  };

  const handleInputChange = (field: 'count' | 'lapLimit', value: string) => {
    const parsedValue = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(parsedValue)) return; 

    if (editedCounter) {
      setEditedCounter({ ...editedCounter, [field]: parsedValue });
    }
  };

  return (
  <TouchableWithoutFeedback onPress={increaseCount}>
    <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
    <StatusBar backgroundColor={currentTheme.bg} barStyle={currentTheme.bg === '#FFFFFF' ? 'dark-content' : 'light-content'} />
    {/* Header */}
    <View style={styles.header}>
      <Ionicons
      name="menu"
      size={30}
      color={currentTheme.text}
      style={styles.iconLeft}
      onPress={() => setShowSidebar(true)}
      />
    </View>

    {/* Counter Display */}
    {activeCounter && (
      <>
        <Text style={[styles.counterTitle, { color: currentTheme.text }]}>
          {activeCounter.counterName}
        </Text>
        <CircularCounter
          textClr={currentTheme.text}
          bgClr={currentTheme.bg}
          count={activeCounter.count}
          lapLimit={activeCounter.lapLimit}
          onIncrease={increaseCount}
          onDecrease={decreaseCount}
        />
      </>
    )}


      {/* Sidebar */}
      <Modal visible={showSidebar} animationType="slide">
        <View style={styles.sidebar}>
        <View style={styles.lr}>
      
      <Text style={styles.sidebarTitle}>Counters</Text>
      <Ionicons
        name="close"
        size={35}
        color="#000"
        onPress={() => setShowSidebar(false)}
      />
    </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>+ Create Counter</Text>
          </TouchableOpacity>

          <FlatList
            data={counters}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.counterItem}
                onPress={() => handleSelectCounter(item)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
    <Text style={styles.counterItemText}>{item.counterName}</Text>
    <Text style={styles.counterItemText}>{item.count}</Text>
  </View>


              </TouchableOpacity>
            )}
          />
          
        </View>
      </Modal>

      {/* Create Counter Modal */}
      <Modal visible={showCreateModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Counter</Text>
            <TextInput
              style={styles.input}
              placeholder="Counter Name"
              value={newCounterName}
              onChangeText={setNewCounterName}
            />
            <Button title="Create" onPress={handleCreateCounter} />
            <Button title="Cancel" onPress={() => setShowCreateModal(false)} />
          </View>
        </View>
      </Modal>

      {/* Edit Counter Modal */}
      <Modal visible={showEditModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Counter</Text>

            {editedCounter ? (
              <>
                <Text>Counter Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Counter Name"
                  value={editedCounter.counterName}
                  onChangeText={(text) => setEditedCounter({ ...editedCounter, counterName: text })}
                />
                <Text>Lap Limit</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Lap Limit"
                  value={editedCounter.lapLimit.toString()}
                  keyboardType="numeric"
                  onChangeText={(text) => handleInputChange('lapLimit', text)}
                />
                <Text>Current Value</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Current Value"
                  value={editedCounter.count.toString()}
                  keyboardType="numeric"
                  onChangeText={(text) => handleInputChange('count', text)}
                />
              </>
            ) : null}

            <View style={styles.modalButtonsContainer}>
              <Button title="Save" onPress={handleSaveCounter} />
              <Button title="Cancel" onPress={() => setShowEditModal(false)} />
              <Button title="Delete Counter" color="red" onPress={handleDeleteCounter} />
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.bottomNav, { backgroundColor: currentTheme.bg }]}>
      <Ionicons name="remove" size={30} color={currentTheme.text} onPress={decreaseCount} />
      <Ionicons name="refresh" size={30} color={currentTheme.text} onPress={resetCount} />
      <Ionicons name="create" size={30} color={currentTheme.text} onPress={handleEditCounter} />
      <Ionicons
        name="color-palette"
        size={30}
        color={currentTheme.text}
        onPress={toggleTheme}
      />
      <Ionicons
        name={vibrationEnabled ? "volume-high" : "volume-mute"}
        size={30}
        color={currentTheme.text}
        style={styles.iconRight}
        onPress={() => setVibrationEnabled((prev) => !prev)}
      />
    </View>

    </View>
    </TouchableWithoutFeedback>


  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconLeft: {
    marginLeft: 10,
  },
  iconRight: {
    marginRight: 10,
  },
  counterTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 20,
  },
  sidebar: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    padding: 20,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  createButton: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  createButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  counterItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  counterItemText: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    width: '100%',
  },
  modalButtonsContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: 10,
  },
  lr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  iconRightContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Aligns the icons to the right
    gap: 20, // Space between icons
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
  },
  

});
