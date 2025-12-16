import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getStoredIsAdmin, loginUser, registerUser } from '@/utils/auth';
import { useTranslation } from '@/utils/i18n';
import { devLog } from '@/utils/logger';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AuthScreenProps {
  onAuthSuccess: (username: string, isAdmin: boolean) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = (): string | null => {
    if (!username.trim()) {
      return t('usernameRequired');
    }

    // Only validate username format when registering
    if (!isLogin) {
      const usernameRegex = /^[a-zA-ZöäåÖÄÅ0-9\-+]+$/;
      if (!usernameRegex.test(username.trim())) {
        return t('usernameInvalidCharacters');
      }
    }

    if (!password) {
      return t('passwordRequired');
    }
    if (password.length < 6) {
      return t('passwordTooShort');
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert(t('error'), validationError);
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await loginUser(username.trim(), password);
      } else {
        await registerUser(username.trim(), password);
      }
      // Retrieve admin status after successful authentication
      const isAdmin = await getStoredIsAdmin();
      onAuthSuccess(username.trim(), isAdmin);
    } catch (error: any) {
      // Use devLog instead of logError since these are expected user errors (wrong password, etc.)
      devLog('Auth error:', error.message || error);
      Alert.alert(
        isLogin ? t('loginError') : t('registerError'),
        error.message || t('unexpectedError')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>RetkiRapsa</Text>
          <View
            style={[
              styles.modeIndicator,
              isLogin ? styles.modeIndicatorLogin : styles.modeIndicatorRegister,
            ]}
          >
            <MaterialCommunityIcons
              name={isLogin ? 'login' : 'account-plus'}
              size={28}
              color="#2e7d32"
              style={styles.modeIcon}
            />
            <Text style={styles.subtitle}>{isLogin ? t('loginTitle') : t('registerTitle')}</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {isLogin ? t('usernameLogin') : t('usernameRegister')}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t('usernamePlaceholder')}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('password')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? t('loginButton') : t('registerButton')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setUsername('');
                setPassword('');
              }}
              disabled={loading}
            >
              <Text style={styles.switchButtonText}>
                {isLogin ? t('noAccount') : t('haveAccount')}
              </Text>
              <Text style={[styles.switchButtonText, styles.switchButtonTextBold]}>
                {isLogin ? t('registerTitle') : t('loginTitle')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 20,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 40,
  },
  modeIcon: {
    marginRight: 10,
  },
  modeIndicatorLogin: {
    backgroundColor: '#e3f2fd',
  },
  modeIndicatorRegister: {
    backgroundColor: '#e8f5e9',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  switchButtonTextBold: {
    color: '#2e7d32',
    fontWeight: '600',
  },
});
