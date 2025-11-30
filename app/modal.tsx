import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import colors from '@/constants/Colors';

import appConfig from '../app.json';

const Separator: React.FC = () => (
  <View
    style={[styles.separator, { backgroundColor: useColorScheme() === 'dark' ? '#fff' : '#ccc' }]}
  />
);

export default function InstructionsScreen() {
  const backgroundColor =
    useColorScheme() === 'dark' ? colors.dark.background : colors.light.background;
  const foregroundColor = useColorScheme() === 'dark' ? colors.dark.text : colors.light.text;

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor }]}>
      <Text style={[styles.title, { color: foregroundColor }]}>RetkiRapsa</Text>
      <Text style={{ color: foregroundColor }}>Versio {appConfig.expo.version}</Text>
      <Text style={{ color: foregroundColor }}>Copyright (c) {new Date().getFullYear()}</Text>
      <Separator />
      <Text style={{ color: foregroundColor }}>Sovelluksen toteutus</Text>
      <Text style={{ color: foregroundColor }}>Artur Gajewski</Text>
      <Separator />
      <View style={{ marginTop: 20, marginBottom: 20, width: '80%' }}>
        <Text
          style={{ fontSize: 15, marginBottom: 10, textAlign: 'center', color: foregroundColor }}
        >
          RetkiRapsa ei kerää tai lähetä käyttäjätietoja mihinkään palveluun. Sovellus käyttää
          laitteesi sijaintia vain kartan näyttämiseen ja kohteiden näyttämiseen. Ensimmäisen
          käynnistyksen yhteydessä luodaan yksilöllinen tunniste jota käytetään raporttien
          tallentamisen yhteydessä.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
