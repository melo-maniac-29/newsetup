import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

interface StatusIndicatorProps {
  status: 'sent' | 'in-progress' | 'rescued' | 'cancelled' | 'pending' | 'verified' | 'assigned' | 'resolved';
  size?: 'small' | 'medium';
}

export function StatusIndicator({ status, size = 'medium' }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'sent':
      case 'pending':
        return { color: theme.colors.warning, label: status.charAt(0).toUpperCase() + status.slice(1) };
      case 'in-progress':
      case 'assigned':
        return { color: theme.colors.accent, label: 'In Progress' };
      case 'rescued':
      case 'resolved':
        return { color: theme.colors.success, label: status.charAt(0).toUpperCase() + status.slice(1) };
      case 'cancelled':
        return { color: theme.colors.onSurfaceVariant, label: 'Cancelled' };
      case 'verified':
        return { color: theme.colors.success, label: 'Verified' };
      default:
        return { color: theme.colors.onSurfaceVariant, label: 'Unknown' };
    }
  };

  const { color, label } = getStatusConfig();

  return (
    <View style={styles.container}>
      <View style={[styles.dot, styles[size], { backgroundColor: color }]} />
      <Text style={[styles.text, styles[`${size}Text`], { color }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    borderRadius: 50,
    marginRight: theme.spacing.xs,
  },
  text: {
    fontWeight: '500',
  },
  
  small: {
    width: 6,
    height: 6,
  },
  medium: {
    width: 8,
    height: 8,
  },
  
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
});