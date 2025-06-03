import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { $ } from '../styles';
import { AppView } from './appview.component';
import { AppText } from './apptext.component';

interface OrganizationCardProps {
  organization: {
    id: number;
    name: string;
    image?: string;
    address: string;
    services: any[];
  };
  onPress: () => void;
}

export function OrganizationCard({ organization, onPress }: OrganizationCardProps) {
  return (
    <TouchableOpacity 
      style={[$.mb_normal]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <AppView style={[styles.container]}>
        {organization.image && (
          <AppView style={styles.imageContainer}>
            <Image 
              source={{ uri: organization.image }} 
              style={styles.image}
              resizeMode="cover"
            />
          </AppView>
        )}
        <AppView style={[$.p_regular]}>
          <AppText style={[$.fs_regular, $.fw_semibold, $.text_tint_1, $.mb_small]}>
            {organization.name}
          </AppText>
          <AppView style={[$.flex_row, $.align_items_center, $.mb_small]}>
            <MapPin size={16} color={$.tint_3} />
            <AppText 
              style={[$.fs_small, $.text_tint_3, $.ml_tiny, $.flex_1]}
            >
              {organization.address}
            </AppText>
          </AppView>
          {/* <AppText style={[$.fs_small, $.text_primary5, $.fw_medium]}>
            {organization.services.length} {organization.services.length === 1 ? 'service' : 'services'} available
          </AppText> */}
        </AppView>
      </AppView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 150,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.light.background,
  },
}); 