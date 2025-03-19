import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Button } from '../../components/Button';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';


export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDeleteAccount
        }
      ],
      { cancelable: true }
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      // First attempt to delete the user
      await user?.delete();
      // If successful, sign out
      await signOut();
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert(
        "Error",
        "There was a problem deleting your account. Please try again later."
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Settings</ThemedText>
      
      <View style={styles.section}>
        <ThemedText type="subtitle">Account</ThemedText>
        <Button
          onPress={() => signOut()}
          style={styles.button}
          textStyle={styles.buttonText}
        >
          Sign Out
        </Button>
        
        <Button
          onPress={handleDeleteAccount}
          style={styles.deleteButton}
          textStyle={styles.buttonText}
        >
          Delete Account
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginTop: 20,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#FF3B30',
  },
  deleteButton: {
    marginTop: 20,
    backgroundColor: '#FF0000',
  },
  buttonText: {
    color: 'white',
  },
});