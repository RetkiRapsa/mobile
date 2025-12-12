import { ScrollView, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';
import colors from '@/constants/Colors';
import { useTranslation } from '@/utils/i18n';

export default function InfoScreen({
  onAcknowledge,
  showButton,
}: {
  onAcknowledge?: () => void;
  showButton?: boolean;
}) {
  const { t } = useTranslation();
  const backgroundColor =
    useColorScheme() === 'dark' ? colors.dark.background : colors.light.background;
  const foregroundColor = useColorScheme() === 'dark' ? colors.dark.text : colors.light.text;
  const buttonStyle = useColorScheme() === 'dark' ? styles.buttonDarkMode : styles.buttonLightMode;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={[]}>
      <ScrollView
        style={[styles.container, { backgroundColor }]}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>RetkiRapsa</Text>

        <Text style={styles.intro}>{t('infoIntro')}</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>{t('infoNoRegistrationTitle')}</Text>
          <Text style={styles.text}>{t('infoNoRegistrationText1')}</Text>
          <Text style={styles.text}>{t('infoNoRegistrationText2')}</Text>
        </View>

        <View style={[styles.section, { backgroundColor }]}>
          <Text style={styles.heading}>{t('infoSearchTitle')}</Text>
          <Text style={styles.text}>{t('infoSearchText1')}</Text>
          <Text style={styles.text}>{t('infoSearchText2')}</Text>
        </View>

        <View style={[styles.section, { backgroundColor }]}>
          <Text style={styles.heading}>{t('infoIconColorsTitle')}</Text>
          <Text style={styles.text}>{t('infoIconColorsText1')}</Text>
          <Text style={styles.text}>{t('infoIconColorsText2')}</Text>
          <Text style={styles.text}>{t('infoIconColorsText3')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>{t('infoReadUpdatesTitle')}</Text>
          <Text style={styles.text}>{t('infoReadUpdatesText1')}</Text>
          <Text style={styles.text}>{t('infoReadUpdatesText2')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>{t('infoAddUpdateTitle')}</Text>
          <Text style={styles.text}>{t('infoAddUpdateText1')}</Text>
          <Text style={styles.text}>{t('infoAddUpdateText2')}</Text>
          <Text style={styles.text}>{t('infoAddUpdateText3')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>{t('infoMissingLocationTitle')}</Text>
          <Text style={styles.text}>{t('infoMissingLocationText1')}</Text>
          <Text style={styles.text}>{t('infoMissingLocationText2')}</Text>
          <Text style={styles.text}>{t('infoMissingLocationText3')}</Text>
          <Text style={styles.text}>{t('infoMissingLocationText4')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>{t('infoTipsTitle')}</Text>
          <Text style={styles.text}>{t('infoTipsText1')}</Text>
          <Text style={styles.text}>{t('infoTipsText2')}</Text>
          <Text style={styles.text}>{t('infoTipsText3')}</Text>
          <Text style={styles.text}>{t('infoTipsText4')}</Text>
          <Text style={styles.text}>{t('infoTipsText5')}</Text>
          <Text style={styles.text}>{t('infoTipsText6')}</Text>
          <Text style={styles.text}>{t('infoTipsText7')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>{t('infoFeedbackTitle')}</Text>
          <Text style={styles.text}>{t('infoFeedbackText1')}</Text>
          <Text style={styles.text}>{t('infoFeedbackEmail')}</Text>
        </View>

        {showButton && onAcknowledge && (
          <TouchableOpacity style={[buttonStyle, { marginTop: 20 }]} onPress={onAcknowledge}>
            <Text style={{ color: foregroundColor }}>{t('startApp')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  intro: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  section: {
    fontSize: 16,
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    marginBottom: 4,
    lineHeight: 22,
  },
  buttonDarkMode: {
    borderWidth: 0,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    backgroundColor: '#676767',
    borderColor: '#757575',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 40,
  },
  buttonLightMode: {
    borderWidth: 2,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderColor: '#656565',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    marginBottom: 40,
  },
});
