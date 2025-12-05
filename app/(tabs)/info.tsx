import { ScrollView, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import { Text, View } from '@/components/Themed';
import colors from '@/constants/Colors';

export default function InfoScreen({
  onAcknowledge,
  showButton,
}: {
  onAcknowledge?: () => void;
  showButton?: boolean;
}) {
  const backgroundColor =
    useColorScheme() === 'dark' ? colors.dark.background : colors.light.background;
  const foregroundColor = useColorScheme() === 'dark' ? colors.dark.text : colors.light.text;
  const buttonStyle = useColorScheme() === 'dark' ? styles.buttonDarkMode : styles.buttonLightMode;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>RetkiRapsa</Text>

      <Text style={styles.intro}>
        RetkiRapsa on helppokäyttöinen sovellus retkikohteiden arvioimiseen ja löytämiseen. Voit
        etsiä retkikohteita kartalta, lukea muiden retkeilijöiden arvosteluja ja jakaa omat
        kokemuksesi – ilman kirjautumista!
      </Text>

      <View style={[styles.section, { backgroundColor }]}>
        <Text style={styles.heading}>Etsi kohteita kartalta</Text>
        <Text style={styles.text}>
          • Sovellus näyttää lähelläsi olevat taukopaikat, kuten laavut, nuotiopaikat, vessat ja
          parkkipaikat.
        </Text>
        <Text style={styles.text}>
          • Voit selata karttaa ja zoomata etsiäksesi kohteita haluamaltasi alueelta.
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor }]}>
        <Text style={styles.heading}>Kartan ikonien värit</Text>
        <Text style={styles.text}>
          • Mikäli kohteen ikoni on punainen, tarkoittaa se sitä, ettei kohde ole käytössä tai jokin
          luonnonvoima on vaikuttanut siihen niin, ettei kohdetta voi käyttää. Muussa tapauksessa
          ikoni on musta.
        </Text>
        <Text style={styles.text}>
          • Mikäli kohteen reuna on punainen, tarkoittaa se sitä, että kohteessa on havaittu
          punkkeja. Muussa tapauksessa reuna on vihreä.
        </Text>
        <Text style={styles.text}>
          • Mikäli et erota ikonin värejä, saat samat tiedot näkyviin napauttamalla kohteen ikonia
          kartalla.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Lue muiden päivityksiä</Text>
        <Text style={styles.text}>• Napauta kartalla näkyvää ikonia saadaksesi lisätietoja.</Text>
        <Text style={styles.text}>
          • Näet kohteiden päivityksiä ja huomioita käyttäjiltä, jotka ovat vierailleet kohteessa
          ennen sinua.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Jätä oma päivitys</Text>
        <Text style={styles.text}>
          • Lisää oma päivitys painamalla kohteen omalla sivulla painamalla "Lisää
          päivitys"-painiketta. Huomioi, että lisätäksesi päivityksen kohteeseen, sinun tulee olla
          lähellä kyseistä kohdetta.
        </Text>
        <Text style={styles.text}>
          • Arvioi mm. siisteys, yleisvaikutelma ja kirjoita lyhyt kommentti.
        </Text>
        <Text style={styles.text}>
          • Sovellus tallentaa päivityksesi ja muut käyttäjät näkevät sen heti kyseisessä kohteessa.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Puuttuuko kartalta joku kohde?</Text>
        <Text style={styles.text}>
          • Ei hätää, voit lisätä uuden kohteen kartalle klikkaamalla "+" painiketta.
        </Text>
        <Text style={styles.text}>
          • Uusi kohde tallennetaan aina siihen kohtaan kartalla jossa olet GPS:n mukaan kyseisellä
          hetkellä.
        </Text>
        <Text style={styles.text}>
          • Valitse kohteelle nimi, esim. "Iso-Melkuttimen lepakkolaavu" ja lisää kohteen tyyppi.
        </Text>
        <Text style={styles.text}>
          • Kun tiedot on täytetty, paina "Tallenna" ja uusi kohde lisätään kartalle heti jonka
          jälkeen voit lisätä siihen päivityksiä.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Ei vaadi rekisteröitymistä</Text>
        <Text style={styles.text}>
          • Sovellus ei kerää henkilötietoja. Sovelluksen asennuksen jälkeen, ensimmäisen
          käynnistyksen yhteydessä luodaan sinulle yksilöllinen tunniste jota käytetään kohteiden
          luomisen ja päivityksien tallentamisen yhteydessä. Tämä yksilöllinen tunneiste ei sisällä
          mitään henkilökohtaisia tietoja ja säilyy laitteellasi ainoastaan niin kauan kuin sovellus
          on asennettuna laitteessasi.
        </Text>
        <Text style={styles.text}>
          • Tällä tavalla sinun ei tarvitse rekisteröityä käyttääksesi sovellusta ja voit arvioida
          kohteita nopeasti ja vaivatta.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Vinkkejä käyttöön</Text>
        <Text style={styles.text}>
          • Salli puhelimessasi sijainnin käyttö, jotta sovellus voi näyttää sijaintisi kartalla
          sinisenä pisteenä.
        </Text>
        <Text style={styles.text}>
          • Sovellus lataa automaattisesti kohteet kartan näkyvältä alueelta kun avaat kartan.
        </Text>
        <Text style={styles.text}>• Voit liikuttaa ja zoomata karttaa vapaasti eri alueille.</Text>
        <Text style={styles.text}>
          • Vasemmassa alakulmassa oleva pyöreä painike: Päivitä kohteet kartan nykyiseltä näkyvältä
          alueelta. Käytä tätä kun olet siirtänyt karttaa uudelle alueelle ja haluat nähdä kyseisen
          alueen kohteet.
        </Text>
        <Text style={styles.text}>
          • Oikeassa alakulmassa oleva pyöreä painike: Keskitä kartta takaisin nykyiseen
          GPS-sijaintiisi ja hae kohteet. Käytä tätä jos olet eksynyt kartalla ja haluat palata
          takaisin sijaintiisi.
        </Text>
        <Text style={styles.text}>• Sininen piste kartalla näyttää nykyisen GPS-sijaintisi.</Text>
        <Text style={styles.text}>
          • Jos havaitset virheen kohteessa, mainitse siitä arviossasi – muut käyttäjät kiittävät!
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Palaute ja kehitys</Text>
        <Text style={styles.text}>
          RetkiRapsa kehittyy palautteen perusteella. Lähetä minulle kehitysehdotuksia tai
          virheilmoituksia:
        </Text>
        <Text style={styles.text}>Sähköposti: artur.gajewski@hotmail.com</Text>
      </View>

      {showButton && onAcknowledge && (
        <TouchableOpacity style={[buttonStyle, { marginTop: 20 }]} onPress={onAcknowledge}>
          <Text style={{ color: foregroundColor }}>Aloita sovellus</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  contentContainer: {
    padding: 16,
    marginBottom: 40,
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
