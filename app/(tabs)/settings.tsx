import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Button } from '../../components/Button';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { SubscriptionCard } from '../../components/SubscriptionCard';
import { MaterialIcons } from '@expo/vector-icons';
import { useSemanticColor } from '@/hooks/useThemeColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/config';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const primaryColor = useSemanticColor('primary');
  const insets = useSafeAreaInsets();

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

  // Handle subscribe action
  const handleSubscribe = (plan?: string) => {
    // Use the environment variable for the API URL
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    
    if (!apiUrl) {
      console.error("EXPO_PUBLIC_API_URL is not defined in environment");
      Alert.alert(
        "Configuration Error",
        "Subscription URL is missing. Please contact support."
      );
      return;
    }
    
    // Construct the URL with optional plan parameter
    const subscriptionUrl = `${apiUrl}${plan ? `?plan=${plan}` : ''}`;
    
    // Open the URL in the device browser
    Linking.openURL(subscriptionUrl).catch(err => {
      console.error("Error opening subscription URL:", err);
      Alert.alert(
        "Error",
        "Could not open subscription page. Please try again later."
      );
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView variant="elevated" style={[styles.header, { paddingTop: Math.max(20, insets.top) }]}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="settings" size={28} color={primaryColor} style={styles.icon} />
          <ThemedText type="heading" style={styles.headerTitle}>Settings</ThemedText>
        </View>
        <ThemedText colorName="textSecondary" type="label" style={styles.headerSubtitle}>
          Manage your account and preferences
        </ThemedText>
      </ThemedView>
      
      <ScrollView style={styles.contentContainer}>
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Account</ThemedText>
          
          <ThemedView variant="elevated" style={styles.card}>
            <View style={styles.userInfo}>
              <MaterialIcons name="account-circle" size={40} color={primaryColor} />
              <View style={styles.userDetails}>
                <ThemedText type="defaultSemiBold">{user?.fullName || user?.username}</ThemedText>
                <ThemedText colorName="textSecondary" type="caption">{user?.primaryEmailAddress?.emailAddress}</ThemedText>
              </View>
            </View>
          </ThemedView>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Subscription</ThemedText>
          
          <SubscriptionStatus />

          <Button
            onPress={() => Linking.openURL('https://app.notecompanion.ai/dashboard/pricing')}
            variant="primary"
            style={styles.subscriptionButton}
            leftIcon={<MaterialIcons name="star" size={20} color="#fff" />}
          >
            Upgrade Your Plan
          </Button>
        </View>
        
        {/* Bottom buttons */}
        <View style={styles.bottomActions}>
          <Button
            onPress={() => signOut()}
            variant="secondary" 
            textStyle={{color: '#333333', fontWeight: '600'}}
          >
            Sign Out
          </Button>
        </View>
        
        {/* Danger Zone Section */}
        <View style={styles.dangerSection}>
          <ThemedText type="subtitle" style={styles.dangerTitle}>Danger Zone</ThemedText>
          <ThemedView style={styles.dangerCard}>
            <ThemedText style={styles.dangerText}>
              Deleting your account will permanently remove all your data and cannot be undone.
            </ThemedText>
            <Button
              onPress={handleDeleteAccount}
              variant="danger" 
              style={styles.deleteButton}
            >
              Delete Account
            </Button>
          </ThemedView>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// Create the SubscriptionStatus component
function SubscriptionStatus() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<{
    tokenUsage: number;
    maxTokenUsage: number;
    subscriptionStatus: string;
    currentPlan: string;
  } | null>(null);
  const { getToken } = useAuth();
  const backgroundColor = useSemanticColor('background');
  const primaryColor = useSemanticColor('primary');

  useEffect(() => {
    async function fetchSubscriptionData() {
      try {
        const token = await getToken();
        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/api/usage`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Error fetching subscription data: ${response.status}`);
        }

        const data = await response.json();
        setUsageData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching subscription info:", err);
        setError("Could not load subscription information");
        setLoading(false);
      }
    }

    fetchSubscriptionData();
  }, []);

  if (loading) {
    return (
      <ThemedView variant="elevated" style={styles.subscriptionCard}>
        <ActivityIndicator size="small" color={primaryColor} />
        <ThemedText style={{ marginTop: 8 }}>Loading subscription information...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView variant="elevated" style={styles.subscriptionCard}>
        <MaterialIcons name="error-outline" size={24} color="#E53E3E" />
        <ThemedText style={{ marginTop: 8 }}>{error}</ThemedText>
      </ThemedView>
    );
  }

  // Format the plan name for display
  const getPlanDisplay = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'free':
        return 'Free Plan';
      case 'monthly':
        return 'Monthly Subscription';
      case 'yearly':
        return 'Yearly Subscription';
      case 'lifetime':
        return 'Lifetime Access';
      default:
        return plan || 'Free Plan';
    }
  };

  return (
    <ThemedView variant="elevated" style={styles.subscriptionCard}>
      <View style={styles.planInfo}>
        <MaterialIcons 
          name={usageData?.currentPlan === 'free' ? 'star-outline' : 'star'} 
          size={24} 
          color={usageData?.currentPlan === 'free' ? '#888' : primaryColor} 
        />
        <View style={styles.planDetails}>
          <ThemedText type="defaultSemiBold">
            {getPlanDisplay(usageData?.currentPlan || 'free')}
          </ThemedText>
          <ThemedText colorName="textSecondary" type="caption">
            {usageData?.subscriptionStatus === 'active' ? 'Active Subscription' : 'Free Usage'}
          </ThemedText>
        </View>
      </View>

      {usageData && (
        <View style={styles.usageInfo}>
          <ThemedText type="caption" colorName="textSecondary">
            Usage: {usageData.tokenUsage} / {usageData.maxTokenUsage} tokens
          </ThemedText>
          <View style={styles.usageBar}>
            <View 
              style={[
                styles.usageProgress, 
                { 
                  width: `${Math.min(100, (usageData.tokenUsage / usageData.maxTokenUsage) * 100)}%`,
                  backgroundColor: usageData.currentPlan === 'free' ? '#888' : primaryColor
                }
              ]} 
            />
          </View>
        </View>
      )}

      <ThemedText style={styles.subscriptionNote}>
        {usageData?.currentPlan === 'free' 
          ? 'Upgrade to a paid plan for increased processing limits and premium features.'
          : 'Manage your subscription at app.notecompanion.ai/dashboard'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderRadius: 0,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        marginBottom: 0,
      },
      android: {
        elevation: 2,
        marginBottom: 4,
      },
    }),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerSubtitle: {
    marginBottom: 8,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
  },
  // Subscription styles
  subscriptionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
    width: '100%',
  },
  planDetails: {
    marginLeft: 12,
  },
  usageInfo: {
    width: '100%',
    marginBottom: 16,
  },
  usageBar: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  usageProgress: {
    height: '100%',
    borderRadius: 3,
  },
  subscriptionNote: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: 16,
  },
  subscriptionButton: {
    marginTop: 16,
    borderRadius: 12,
    minHeight: 48,
  },
  signOutButton: {
    marginTop: 10,
    borderRadius: 12,
    minHeight: 50, // Taller buttons for better touch targets
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    // We're explicitly setting backgroundColor in the component itself
  },
  bottomActions: {
    paddingVertical: 20,
    marginTop: 10,
  },
  dangerSection: {
    marginTop: 10,
    marginBottom: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  dangerTitle: {
    color: '#E53E3E',
    marginBottom: 16,
  },
  dangerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.3)',
    backgroundColor: 'rgba(254, 215, 215, 0.1)',
  },
  dangerText: {
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    borderRadius: 12,
    minHeight: 48,
    backgroundColor: '#E53E3E',
    marginTop: 8,
  },
});