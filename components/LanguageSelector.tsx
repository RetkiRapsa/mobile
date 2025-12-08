import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getLocale, setLocale } from '@/utils/i18n';

type Language = 'fi' | 'en';

interface LanguageSelectorProps {
  onLanguageChange?: (locale: Language) => void;
}

export default function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const [currentLocale, setCurrentLocale] = React.useState<Language>(getLocale());

  const handleLanguageChange = (locale: Language) => {
    setLocale(locale);
    setCurrentLocale(locale);
    onLanguageChange?.(locale);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Kieli / Language</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, currentLocale === 'fi' && styles.buttonActive]}
          onPress={() => handleLanguageChange('fi')}
        >
          <Text style={[styles.buttonText, currentLocale === 'fi' && styles.buttonTextActive]}>
            Suomi
          </Text>
        </TouchableOpacity>
        <View style={styles.buttonSeparator} />
        <TouchableOpacity
          style={[styles.button, currentLocale === 'en' && styles.buttonActive]}
          onPress={() => handleLanguageChange('en')}
        >
          <Text style={[styles.buttonText, currentLocale === 'en' && styles.buttonTextActive]}>
            English
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2c5f2d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSeparator: {
    width: 1,
    height: '100%',
    backgroundColor: '#2c5f2d',
  },
  buttonActive: {
    backgroundColor: '#2c5f2d',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5f2d',
  },
  buttonTextActive: {
    color: '#fff',
  },
});
