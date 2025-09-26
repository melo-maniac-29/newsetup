import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium';
}

export function Badge({ label, variant = 'primary', size = 'medium' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], styles[size]]}>
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
  
  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
  },
  accent: {
    backgroundColor: theme.colors.accent,
  },
  success: {
    backgroundColor: theme.colors.success,
  },
  warning: {
    backgroundColor: theme.colors.warning,
  },
  danger: {
    backgroundColor: theme.colors.danger,
  },
  
  // Text colors
  primaryText: {
    color: theme.colors.secondary,
  },
  accentText: {
    color: theme.colors.secondary,
  },
  successText: {
    color: theme.colors.secondary,
  },
  warningText: {
    color: theme.colors.secondary,
  },
  dangerText: {
    color: theme.colors.secondary,
  },
  
  // Sizes
  small: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
});