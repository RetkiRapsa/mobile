import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { deleteAccount } from '@/utils/auth';
import { useTranslation } from '@/utils/i18n';
import { logError } from '@/utils/logger';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ProfileScreenProps {
  displayName: string;
  onAccountDeleted: () => void;
}

export default function ProfileScreen({ displayName, onAccountDeleted }: ProfileScreenProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(t('deleteAccount'), t('deleteAccountWarning'), [
      {
        text: t('cancel'),
        style: 'cancel',
      },
      {
        text: t('deleteAccount'),
        style: 'destructive',
        onPress: () => setShowDeleteConfirm(true),
      },
    ]);
  };

  const confirmDeleteAccount = async () => {
    if (!password.trim()) {
      Alert.alert(t('error'), t('enterPasswordToConfirm'));
      return;
    }

    setDeleting(true);
    try {
      await deleteAccount(password);
      Alert.alert(t('deleteAccount'), t('accountDeleted'), [
        {
          text: t('ok'),
          onPress: () => {
            setShowDeleteConfirm(false);
            onAccountDeleted();
          },
        },
      ]);
    } catch (error: any) {
      logError('Failed to delete account:', error);
      Alert.alert(t('error'), error.message || t('accountDeletionFailed'));
    } finally {
      setDeleting(false);
    }
  };

  if (showDeleteConfirm) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={64}
              color="#ff3b30"
              style={styles.warningIcon}
            />
            <Text style={styles.title}>{t('deleteAccountConfirm')}</Text>
            <Text style={styles.warningText}>{t('deleteAccountWarning')}</Text>

            <View style={styles.formContainer}>
              <Text style={styles.label}>{t('enterPasswordToConfirm')}</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border || '#ccc' }]}
                placeholder={t('password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!deleting}
              />

              <TouchableOpacity
                style={[styles.deleteButton, deleting && styles.buttonDisabled]}
                onPress={confirmDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t('deleteAccount')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setPassword('');
                }}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="account-circle"
          size={80}
          color={colors.tint}
          style={styles.headerIcon}
        />
        <Text style={[styles.displayName, { color: colors.text }]}>{displayName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile')}</Text>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>{t('deleteAccount')}</Text>
          <Text style={styles.dangerZoneDescription}>{t('deleteAccountWarning')}</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <MaterialCommunityIcons name="delete-forever" size={24} color="#fff" />
            <Text style={styles.dangerButtonText}>{t('deleteAccount')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  content: {
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  headerIcon: {
    marginBottom: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dangerZone: {
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff3b30',
    marginBottom: 8,
  },
  dangerZoneDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  dangerButton: {
    backgroundColor: '#ff3b30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  warningIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff3b30',
    marginBottom: 16,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
