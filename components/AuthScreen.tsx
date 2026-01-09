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

import { getStoredDisplayName, getStoredIsAdmin, loginUser, registerUser } from '@/utils/auth';
import { useTranslation } from '@/utils/i18n';
import { devLog } from '@/utils/logger';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AuthScreenProps {
  onAuthSuccess: (displayName: string, isAdmin: boolean) => void;
  initialMode?: 'login' | 'register';
}

export default function AuthScreen({ onAuthSuccess, initialMode = 'login' }: AuthScreenProps) {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = (): string | null => {
    if (!email.trim()) {
      return t('emailRequired');
    }
    if (!password) {
      return t('passwordRequired');
    }
    if (password.length < 6) {
      return t('passwordTooShort');
    }
    if (!isLogin && !displayName.trim()) {
      return t('displayNameRequired');
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
      let returnedDisplayName: string;

      if (isLogin) {
        await loginUser(email.trim(), password);
        // Get display name from storage after login
        const storedDisplayName = await getStoredDisplayName();
        returnedDisplayName = storedDisplayName || email.trim();
      } else {
        await registerUser(displayName.trim(), email.trim(), password);
        returnedDisplayName = displayName.trim();
      }

      const isAdmin = await getStoredIsAdmin();
      onAuthSuccess(returnedDisplayName, isAdmin);
    } catch (error: any) {
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
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('displayName')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('displayNamePlaceholder')}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('email')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
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
                setDisplayName('');
                setEmail('');
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
