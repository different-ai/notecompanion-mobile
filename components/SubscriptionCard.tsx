import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useSemanticColor } from '@/hooks/useThemeColor';
import * as Haptics from 'expo-haptics';

interface SubscriptionCardProps {
  title: string;
  price: string;
  period: string;
  promoCode?: string;
  promoPrice?: string;
  features: string[];
  ctaText: string;
  onPress: () => void;
  popular?: boolean;
}

export function SubscriptionCard({
  title,
  price,
  period,
  promoCode,
  promoPrice,
  features,
  ctaText,
  onPress,
  popular = false,
}: SubscriptionCardProps) {
  const [isYearly, setIsYearly] = useState(false);
  
  // Get colors from semantic theme system
  const primaryColor = useSemanticColor('primary');
  const textColor = useSemanticColor('text');
  const textSecondaryColor = useSemanticColor('textSecondary');
  const backgroundColor = useSemanticColor('background');
  
  // Calculate displayed price based on billing period
  const displayPrice = isYearly ? 
    `$${parseInt(price) * 10}/year` : // 10 months for the price of 12
    `$${price}/${period}`;
  
  // Toggle billing period
  const toggleBillingPeriod = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsYearly(!isYearly);
  };
  
  return (
    <View style={styles.cardWrapper}>
      {/* Gradient border effect */}
      <View 
        style={[
          styles.gradientBorder,
          popular && styles.popularBorder
        ]} 
      />
      
      {/* Card content */}
      <ThemedView
        variant="card"
        style={styles.card}
      >
        {/* Popular ribbon */}
        {popular && (
          <View style={styles.ribbon}>
            <ThemedText style={styles.ribbonText} colorName="background">Most Popular</ThemedText>
          </View>
        )}
        
        {/* Card header */}
        <ThemedText weight="semibold" style={styles.title}>
          {title}
        </ThemedText>
        
        {/* Subscription toggle */}
        <View style={styles.periodToggleContainer}>
          <ThemedText
            style={[styles.periodLabel, isYearly ? styles.periodLabelInactive : styles.periodLabelActive]}
            colorName={isYearly ? 'textSecondary' : 'primary'}
          >
            Monthly
          </ThemedText>
          
          <TouchableOpacity 
            style={styles.toggle} 
            onPress={toggleBillingPeriod}
            activeOpacity={0.7}
          >
            <View style={[
              styles.toggleKnob, 
              isYearly && styles.toggleKnobActive
            ]} />
          </TouchableOpacity>
          
          <ThemedText
            style={[styles.periodLabel, isYearly ? styles.periodLabelActive : styles.periodLabelInactive]}
            colorName={isYearly ? 'primary' : 'textSecondary'}
          >
            Yearly
          </ThemedText>
        </View>
        
        {/* Price display */}
        <View style={styles.priceContainer}>
          <ThemedText style={styles.price} weight="bold">
            {displayPrice}
          </ThemedText>
          
          {promoPrice && promoCode && (
            <ThemedText style={styles.promoText} colorName="primary">
              First {period} ${promoPrice} with code {promoCode}
            </ThemedText>
          )}
        </View>
        
        {/* Features list */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <MaterialIcons 
                name="check" 
                size={18} 
                color="rgb(159, 122, 234)" // Hard-coded primary color
                style={styles.featureIcon} 
              />
              <ThemedText 
                style={styles.featureText} 
                colorName="textSecondary"
              >
                {feature}
              </ThemedText>
            </View>
          ))}
        </View>
        
        {/* CTA Button */}
        <Button
          variant="primary"
          style={styles.ctaButton}
          onPress={onPress}
          rightIcon={<MaterialIcons name="arrow-right" size={18} color="#fff" />}
        >
          {ctaText}
        </Button>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
    marginVertical: 20,
    marginHorizontal: 2,
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(159, 122, 234, 0.2)', // Primary color with low opacity
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  popularBorder: {
    borderColor: 'rgba(159, 122, 234, 0.4)', // More visible for popular plan
  },
  card: {
    borderRadius: 16,
    padding: 24,
    paddingTop: 30, // Extra space for ribbon
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    zIndex: 2,
    overflow: 'hidden',
  },
  ribbon: {
    position: 'absolute',
    top: -14,
    left: '50%',
    transform: [{ translateX: -45 }],
    backgroundColor: 'rgb(159, 122, 234)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  ribbonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  periodToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  periodLabel: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  periodLabelActive: {
    fontWeight: '500',
  },
  periodLabelInactive: {
    opacity: 0.8,
  },
  toggle: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    padding: 2,
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    transform: [{ translateX: 0 }],
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
    backgroundColor: '#FFFFFF',
  },
  priceContainer: {
    height: 88,
    justifyContent: 'flex-end',
    marginBottom: 24,
    alignItems: 'center',
  },
  price: {
    fontSize: 32,
    marginBottom: 4,
  },
  promoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  ctaButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
  },
});