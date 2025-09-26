import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '@/constants/theme';

interface AvatarProps {
  name: string;
  image?: string;
  size?: 'small' | 'medium' | 'large';
}

export function Avatar({ name, image, size = 'medium' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.avatar, styles[size]]}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <Text style={[styles.initials, styles[`${size}Text`]]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  initials: {
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  
  small: {
    width: 32,
    height: 32,
  },
  medium: {
    width: 48,
    height: 48,
  },
  large: {
    width: 72,
    height: 72,
  },
  
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 24,
  },
});