import { useEffect, useState } from 'react';

import * as SecureStore from 'expo-secure-store';

const LANGUAGE_KEY = 'retkirapsa_language';

type TranslationKey =
  | 'locationNotDetermined'
  | 'locationNotDeterminedMessage'
  | 'checkLocationSettings'
  | 'loadingData'
  | 'mapUpdated'
  | 'showingLocations'
  | 'error'
  | 'mapLocationNotDetermined'
  | 'updateFailed'
  | 'tryAgain'
  | 'locationNotLocated'
  | 'notice'
  | 'cannotRefreshSoOften'
  | 'waitBeforeRefresh'
  | 'showing'
  | 'locations'
  | 'version'
  | 'copyright'
  | 'poweredByVPS'
  | 'developmentVersion'
  | 'deviceId'
  | 'copied'
  | 'deviceIdCopied'
  | 'privacyNotice'
  | 'tabMap'
  | 'tabNew'
  | 'tabInfo'
  | 'headerMap'
  | 'headerNewLocation'
  | 'headerWelcome'
  | 'headerReadFirst'
  | 'createLocationTitle'
  | 'locationName'
  | 'locationType'
  | 'selectType'
  | 'save'
  | 'requiredFields'
  | 'locationAdded'
  | 'locationAddFailed'
  | 'nearbyLocationWarning'
  | 'locationNamePlaceholder'
  | 'typeCamping'
  | 'typeFireplace'
  | 'typeLaavu'
  | 'typeToilet'
  | 'typeBeach'
  | 'typeBridge'
  | 'typeParking'
  | 'typeOther'
  | 'gpsLocationNote'
  | 'infoIntro'
  | 'infoSearchTitle'
  | 'infoSearchText1'
  | 'infoSearchText2'
  | 'infoIconColorsTitle'
  | 'infoIconColorsText1'
  | 'infoIconColorsText2'
  | 'infoIconColorsText3'
  | 'infoReadUpdatesTitle'
  | 'infoReadUpdatesText1'
  | 'infoReadUpdatesText2'
  | 'infoAddUpdateTitle'
  | 'infoAddUpdateText1'
  | 'infoAddUpdateText2'
  | 'infoAddUpdateText3'
  | 'infoMissingLocationTitle'
  | 'infoMissingLocationText1'
  | 'infoMissingLocationText2'
  | 'infoMissingLocationText3'
  | 'infoMissingLocationText4'
  | 'infoNoRegistrationTitle'
  | 'infoNoRegistrationText1'
  | 'infoNoRegistrationText2'
  | 'infoTipsTitle'
  | 'infoTipsText1'
  | 'infoTipsText2'
  | 'infoTipsText3'
  | 'infoTipsText4'
  | 'infoTipsText5'
  | 'infoTipsText6'
  | 'infoTipsText7'
  | 'infoFeedbackTitle'
  | 'infoFeedbackText1'
  | 'infoFeedbackEmail'
  | 'startApp'
  | 'aboutHeader'
  | 'backButton'
  | 'locationDetailsHeader'
  | 'locationNotSelected'
  | 'inUse'
  | 'yes'
  | 'no'
  | 'ticksDetected'
  | 'latestUpdates'
  | 'noUpdates'
  | 'addUpdate'
  | 'coordinatesCopied'
  | 'loading'
  | 'observationAtLocation'
  | 'updateTextRequired'
  | 'locationInUse'
  | 'ticksObserved'
  | 'saving'
  | 'cancel'
  | 'updateSaveFailed'
  | 'success'
  | 'updateAdded'
  | 'authenticationFailed'
  | 'serverError'
  | 'noConnection'
  | 'somethingWentWrong'
  | 'unexpectedError'
  | 'tryAgainButton';

type Translations = {
  [key in TranslationKey]: string;
};

const translations: { [locale: string]: Translations } = {
  fi: {
    locationNotDetermined: 'Sijaintia ei voitu määrittää',
    locationNotDeterminedMessage:
      'Sijaintiasi ei voitu paikallistaa. Näytetään Helsinki-alueen kohteita.\n\nTarkista laitteesi sijaintiasetukset.',
    checkLocationSettings: 'Tarkista laitteen sijaintiasetukset',
    loadingData: 'Ladataan tietoja...',
    mapUpdated: 'Kartta päivitetty',
    showingLocations: 'Näytetään',
    error: 'Virhe',
    mapLocationNotDetermined: 'Kartan sijaintia ei voitu määrittää.',
    updateFailed: 'Päivitys epäonnistui. Yritä uudelleen.',
    tryAgain: 'Yritä uudelleen',
    locationNotLocated: 'Sijaintiasi ei voitu paikallistaa. Tarkista laitteesi asetukset.',
    notice: 'Huomio',
    cannotRefreshSoOften: 'Et voi päivittää karttaa näin usein.',
    waitBeforeRefresh: 'Odota hetki ennen kuin päivität uudelleen.',
    showing: 'Näytetään',
    locations: 'kohdetta',
    version: 'Versio',
    copyright: 'Copyright (c)',
    poweredByVPS: 'Powered by VPS',
    developmentVersion: 'Kehitysversio',
    deviceId: 'Tunniste:',
    copied: 'Kopioitu',
    deviceIdCopied: 'Tunniste kopioitu leikepöydälle',
    privacyNotice:
      'RetkiRapsa ei kerää tai lähetä käyttäjätietoja mihinkään palveluun. Sovellus käyttää laitteesi sijaintia vain kartan näyttämiseen ja kohteiden näyttämiseen. Ensimmäisen käynnistyksen yhteydessä luodaan yksilöllinen tunniste jota käytetään raporttien tallentamisen yhteydessä.',
    tabMap: 'Kartta',
    tabNew: 'Uusi',
    tabInfo: 'Ohjeet',
    headerMap: 'Selaa karttaa',
    headerNewLocation: 'Luo uusi kohde',
    headerWelcome: 'Tervetuloa',
    headerReadFirst: 'Lue tämä ensin!',
    createLocationTitle: 'Luo uusi kohde',
    locationName: 'Kohteen nimi',
    locationType: 'Kohteen tyyppi',
    selectType: 'Valitse tyyppi',
    save: 'Tallenna',
    requiredFields: 'Kohteen nimi ja tyyppi ovat pakollisia kenttiä.',
    locationAdded: 'on nyt lisätty kartalle',
    locationAddFailed: 'Kohdetta ei voitu lisätä. Kokeile uudelleen myöhemmin.',
    nearbyLocationWarning:
      'Lähelläsi on kohteita 10 metrin säteellä. Varmista, ettei kohde ole jo olemassa.',
    locationNamePlaceholder: 'Esim. Iso-Melkuttimen laavu',
    typeCamping: 'Telttailu',
    typeFireplace: 'Nuotio',
    typeLaavu: 'Laavu',
    typeToilet: 'WC',
    typeBeach: 'Uimaranta',
    typeBridge: 'Silta',
    typeParking: 'Pysäköinti',
    typeOther: 'Muu',
    gpsLocationNote:
      'Huom! Uusi kohde tallennetaan siihen kohtaan kartalla jossa olet GPS:n mukaan tällä hetkellä.',
    infoIntro:
      'RetkiRapsa on helppokäyttöinen sovellus retkikohteiden arvioimiseen ja löytämiseen. Voit etsiä retkikohteita kartalta, lukea muiden retkeilijöiden arvosteluja ja jakaa omat kokemuksesi – ilman kirjautumista!',
    infoSearchTitle: 'Etsi kohteita kartalta',
    infoSearchText1:
      '• Sovellus näyttää lähelläsi olevat taukopaikat, kuten laavut, nuotiopaikat, vessat ja parkkipaikat.',
    infoSearchText2: '• Voit selata karttaa ja zoomata etsiäksesi kohteita haluamaltasi alueelta.',
    infoIconColorsTitle: 'Kartan ikonien värit',
    infoIconColorsText1:
      '• Mikäli kohteen ikoni on punainen, tarkoittaa se sitä, ettei kohde ole käytössä tai jokin luonnonvoima on vaikuttanut siihen niin, ettei kohdetta voi käyttää. Muussa tapauksessa ikoni on musta.',
    infoIconColorsText2:
      '• Mikäli kohteen reuna on punainen, tarkoittaa se sitä, että kohteessa on havaittu punkkeja. Muussa tapauksessa reuna on vihreä.',
    infoIconColorsText3:
      '• Mikäli et erota ikonin värejä, saat samat tiedot näkyviin napauttamalla kohteen ikonia kartalla.',
    infoReadUpdatesTitle: 'Lue muiden päivityksiä',
    infoReadUpdatesText1: '• Napauta kartalla näkyvää ikonia saadaksesi lisätietoja.',
    infoReadUpdatesText2:
      '• Näet kohteiden päivityksiä ja huomioita käyttäjiltä, jotka ovat vierailleet kohteessa ennen sinua.',
    infoAddUpdateTitle: 'Jätä oma päivitys',
    infoAddUpdateText1:
      '• Lisää oma päivitys painamalla kohteen omalla sivulla painamalla "Lisää päivitys"-painiketta. Huomioi, että lisätäksesi päivityksen kohteeseen, sinun tulee olla lähellä kyseistä kohdetta.',
    infoAddUpdateText2: '• Arvioi mm. siisteys, yleisvaikutelma ja kirjoita lyhyt kommentti.',
    infoAddUpdateText3:
      '• Sovellus tallentaa päivityksesi ja muut käyttäjät näkevät sen heti kyseisessä kohteessa.',
    infoMissingLocationTitle: 'Puuttuuko kartalta joku kohde?',
    infoMissingLocationText1:
      '• Ei hätää, voit lisätä uuden kohteen kartalle klikkaamalla "+" painiketta.',
    infoMissingLocationText2:
      '• Uusi kohde tallennetaan aina siihen kohtaan kartalla jossa olet GPS:n mukaan kyseisellä hetkellä.',
    infoMissingLocationText3:
      '• Valitse kohteelle nimi, esim. "Iso-Melkuttimen lepakkolaavu" ja lisää kohteen tyyppi.',
    infoMissingLocationText4:
      '• Kun tiedot on täytetty, paina "Tallenna" ja uusi kohde lisätään kartalle heti jonka jälkeen voit lisätä siihen päivityksiä.',
    infoNoRegistrationTitle: 'Ei vaadi rekisteröitymistä',
    infoNoRegistrationText1:
      '• Sovellus ei kerää henkilötietoja. Sovelluksen asennuksen jälkeen, ensimmäisen käynnistyksen yhteydessä luodaan sinulle yksilöllinen tunniste jota käytetään kohteiden luomisen ja päivityksien tallentamisen yhteydessä. Tämä yksilöllinen tunneiste ei sisällä mitään henkilökohtaisia tietoja ja säilyy laitteellasi ainoastaan niin kauan kuin sovellus on asennettuna laitteessasi.',
    infoNoRegistrationText2:
      '• Tällä tavalla sinun ei tarvitse rekisteröityä käyttääksesi sovellusta ja voit arvioida kohteita nopeasti ja vaivatta.',
    infoTipsTitle: 'Vinkkejä käyttöön',
    infoTipsText1:
      '• Salli puhelimessasi sijainnin käyttö, jotta sovellus voi näyttää sijaintisi kartalla sinisenä pisteenä.',
    infoTipsText2:
      '• Sovellus lataa automaattisesti kohteet kartan näkyvältä alueelta kun avaat kartan.',
    infoTipsText3: '• Voit liikuttaa ja zoomata karttaa vapaasti eri alueille.',
    infoTipsText4:
      '• Vasemmassa alakulmassa oleva pyöreä painike: Päivitä kohteet kartan nykyiseltä näkyvältä alueelta. Käytä tätä kun olet siirtänyt karttaa uudelle alueelle ja haluat nähdä kyseisen alueen kohteet.',
    infoTipsText5:
      '• Oikeassa alakulmassa oleva pyöreä painike: Keskitä kartta takaisin nykyiseen GPS-sijaintiisi ja hae kohteet. Käytä tätä jos olet eksynyt kartalla ja haluat palata takaisin sijaintiisi.',
    infoTipsText6: '• Sininen piste kartalla näyttää nykyisen GPS-sijaintisi.',
    infoTipsText7:
      '• Jos havaitset virheen kohteessa, mainitse siitä arviossasi – muut käyttäjät kiittävät!',
    infoFeedbackTitle: 'Palaute ja kehitys',
    infoFeedbackText1:
      'RetkiRapsa kehittyy palautteen perusteella. Lähetä minulle kehitysehdotuksia tai virheilmoituksia:',
    infoFeedbackEmail: 'Sähköposti: artur.gajewski@hotmail.com',
    startApp: 'Aloita sovellus',
    aboutHeader: 'Tietoa',
    backButton: 'Takaisin',
    locationDetailsHeader: 'Kohteen tiedot',
    locationNotSelected: 'Sijaintia ei valittu',
    inUse: 'Käytössä',
    yes: 'Kyllä',
    no: 'Ei',
    ticksDetected: 'Punkkeja havaittu',
    latestUpdates: 'Viimeisimmät päivitykset:',
    noUpdates: 'Ei päivityksiä',
    addUpdate: 'Lisää päivitys',
    coordinatesCopied: 'Kohteen koordinaatit kopioitu leikepöydälle',
    loading: 'Ladataan...',
    observationAtLocation: 'Havaintosi kohteessa:',
    updateTextRequired: 'Päivitysteksti on pakollinen.',
    locationInUse: 'Kohde käytössä',
    ticksObserved: 'Punkkeja havaittu',
    saving: 'Tallennetaan...',
    cancel: 'Peruuta',
    updateSaveFailed: 'Päivitystä ei voitu tallentaa. Yritä uudelleen.',
    success: 'Onnistui!',
    updateAdded: 'Päivityksesi on nyt lisätty kohteeseen.',
    authenticationFailed: 'Autentikointi epäonnistui. Yritä sulkea ja avata sovellus uudelleen.',
    serverError: 'Palvelinvirhe. Yritä myöhemmin uudelleen.',
    noConnection: 'Ei yhteyttä palvelimeen. Tarkista internetyhteytesi.',
    somethingWentWrong: 'Jokin meni pieleen',
    unexpectedError:
      'Sovellus kohtasi odottamattoman virheen.\n\nSulje ja avaa sovellus uudelleen.',
    tryAgainButton: 'Yritä uudelleen',
  },
  en: {
    locationNotDetermined: 'Location could not be determined',
    locationNotDeterminedMessage:
      'Your location could not be determined. Showing locations in Helsinki area.\n\nPlease check your device location settings.',
    checkLocationSettings: 'Check device location settings',
    loadingData: 'Loading data...',
    mapUpdated: 'Map updated',
    showingLocations: 'Showing',
    error: 'Error',
    mapLocationNotDetermined: 'Map location could not be determined.',
    updateFailed: 'Update failed. Please try again.',
    tryAgain: 'Try again',
    locationNotLocated: 'Your location could not be determined. Check your device settings.',
    notice: 'Notice',
    cannotRefreshSoOften: 'You cannot refresh the map this often.',
    waitBeforeRefresh: 'Please wait a moment before refreshing again.',
    showing: 'Showing',
    locations: 'locations',
    version: 'Version',
    copyright: 'Copyright (c)',
    poweredByVPS: 'Powered by VPS',
    developmentVersion: 'Development version',
    deviceId: 'Device ID:',
    copied: 'Copied',
    deviceIdCopied: 'Device ID copied to clipboard',
    privacyNotice:
      'RetkiRapsa does not collect or send user data to any service. The app uses your device location only for displaying the map and showing locations. A unique identifier is created on first launch and is used when saving reports.',
    tabMap: 'Map',
    tabNew: 'New',
    tabInfo: 'Info',
    headerMap: 'Browse map',
    headerNewLocation: 'Create new location',
    headerWelcome: 'Welcome',
    headerReadFirst: 'Read this first!',
    createLocationTitle: 'Create new location',
    locationName: 'Location name',
    locationType: 'Location type',
    selectType: 'Select type',
    save: 'Save',
    requiredFields: 'Location name and type are required fields.',
    locationAdded: 'has been added to the map',
    locationAddFailed: 'Could not add location. Please try again later.',
    nearbyLocationWarning:
      'There are locations within 10 meters. Make sure the location does not already exist.',
    locationNamePlaceholder: 'E.g. Big Lake Shelter',
    typeCamping: 'Camping',
    typeFireplace: 'Fireplace',
    typeLaavu: 'Shelter',
    typeToilet: 'Toilet',
    typeBeach: 'Beach',
    typeBridge: 'Bridge',
    typeParking: 'Parking',
    typeOther: 'Other',
    gpsLocationNote:
      'Note! The new location will be saved at the point on the map where you are currently according to GPS.',
    infoIntro:
      'RetkiRapsa is an easy-to-use app for rating and finding outdoor locations. You can search for locations on the map, read reviews from other hikers, and share your own experiences – without registration!',
    infoSearchTitle: 'Search for locations on the map',
    infoSearchText1:
      '• The app shows nearby rest areas, such as shelters, fireplaces, toilets, and parking lots.',
    infoSearchText2: '• You can browse and zoom the map to find locations in your desired area.',
    infoIconColorsTitle: 'Map icon colors',
    infoIconColorsText1:
      '• If the location icon is red, it means the location is not in use or some natural force has affected it so that the location cannot be used. Otherwise, the icon is black.',
    infoIconColorsText2:
      '• If the location border is red, it means that ticks have been detected at the location. Otherwise, the border is green.',
    infoIconColorsText3:
      '• If you cannot distinguish icon colors, you can get the same information by tapping the location icon on the map.',
    infoReadUpdatesTitle: 'Read updates from others',
    infoReadUpdatesText1: '• Tap an icon on the map to get more information.',
    infoReadUpdatesText2:
      '• You will see updates and notes from users who have visited the location before you.',
    infoAddUpdateTitle: 'Leave your own update',
    infoAddUpdateText1:
      '• Add your own update by pressing the "Add update" button on the location page. Note that to add an update to a location, you must be near that location.',
    infoAddUpdateText2: '• Rate cleanliness, overall impression, and write a short comment.',
    infoAddUpdateText3:
      '• The app saves your update and other users will see it immediately at that location.',
    infoMissingLocationTitle: 'Is a location missing from the map?',
    infoMissingLocationText1:
      '• No worries, you can add a new location to the map by clicking the "+" button.',
    infoMissingLocationText2:
      '• The new location is always saved at the point on the map where you are according to GPS at that moment.',
    infoMissingLocationText3:
      '• Choose a name for the location, e.g. "Big Lake Bat Shelter" and add the location type.',
    infoMissingLocationText4:
      '• When the information is filled in, press "Save" and the new location will be added to the map immediately, after which you can add updates to it.',
    infoNoRegistrationTitle: 'No registration required',
    infoNoRegistrationText1:
      '• The app does not collect personal information. After installing the app, a unique identifier is created for you during the first launch, which is used when creating locations and saving updates. This unique identifier does not contain any personal information and remains on your device only as long as the app is installed on your device.',
    infoNoRegistrationText2:
      '• This way you do not need to register to use the app and you can rate locations quickly and easily.',
    infoTipsTitle: 'Tips for use',
    infoTipsText1:
      '• Allow location access on your phone so that the app can show your location on the map as a blue dot.',
    infoTipsText2:
      '• The app automatically loads locations from the visible map area when you open the map.',
    infoTipsText3: '• You can move and zoom the map freely to different areas.',
    infoTipsText4:
      '• Round button in the lower left corner: Update locations from the current visible map area. Use this when you have moved the map to a new area and want to see locations in that area.',
    infoTipsText5:
      '• Round button in the lower right corner: Center the map back to your current GPS location and fetch locations. Use this if you are lost on the map and want to return to your location.',
    infoTipsText6: '• The blue dot on the map shows your current GPS location.',
    infoTipsText7:
      '• If you notice an error in a location, mention it in your review – other users will thank you!',
    infoFeedbackTitle: 'Feedback and development',
    infoFeedbackText1:
      'RetkiRapsa evolves based on feedback. Send me development suggestions or bug reports:',
    infoFeedbackEmail: 'Email: artur.gajewski@hotmail.com',
    startApp: 'Start app',
    aboutHeader: 'About',
    backButton: 'Back',
    locationDetailsHeader: 'Location details',
    locationNotSelected: 'No location selected',
    inUse: 'In use',
    yes: 'Yes',
    no: 'No',
    ticksDetected: 'Ticks detected',
    latestUpdates: 'Latest updates:',
    noUpdates: 'No updates',
    addUpdate: 'Add update',
    coordinatesCopied: 'Location coordinates copied to clipboard',
    loading: 'Loading...',
    observationAtLocation: 'Your observation at the location:',
    updateTextRequired: 'Update text is required.',
    locationInUse: 'Location in use',
    ticksObserved: 'Ticks observed',
    saving: 'Saving...',
    cancel: 'Cancel',
    updateSaveFailed: 'Could not save update. Please try again.',
    success: 'Success!',
    updateAdded: 'Your update has been added to the location.',
    authenticationFailed: 'Authentication failed. Try closing and reopening the app.',
    serverError: 'Server error. Please try again later.',
    noConnection: 'No connection to server. Check your internet connection.',
    somethingWentWrong: 'Something went wrong',
    unexpectedError: 'The app encountered an unexpected error.\n\nPlease close and reopen the app.',
    tryAgainButton: 'Try again',
  },
};

// Default to Finnish
let currentLocale: 'fi' | 'en' = 'fi';

// Listeners for language change
type LanguageChangeListener = (locale: 'fi' | 'en') => void;
const listeners: Set<LanguageChangeListener> = new Set();

/**
 * Subscribe to language changes
 */
export function subscribeToLanguageChange(listener: LanguageChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Get translated string
 */
export function t(key: TranslationKey): string {
  return translations[currentLocale]?.[key] || translations['fi'][key] || key;
}

/**
 * Set locale manually (can be called from app initialization)
 */
export function setLocale(locale: 'fi' | 'en') {
  if (currentLocale !== locale) {
    currentLocale = locale;
    // Save to SecureStore
    SecureStore.setItemAsync(LANGUAGE_KEY, locale).catch((error) => {
      console.error('Failed to save language preference:', error);
    });
    // Notify all listeners
    listeners.forEach((listener) => listener(locale));
  }
}

/**
 * Get current locale
 */
export function getLocale(): 'fi' | 'en' {
  return currentLocale;
}

/**
 * Load saved locale from SecureStore
 */
export async function loadSavedLocale(): Promise<'fi' | 'en'> {
  try {
    const savedLocale = await SecureStore.getItemAsync(LANGUAGE_KEY);
    if (savedLocale === 'en' || savedLocale === 'fi') {
      currentLocale = savedLocale;
      return savedLocale;
    }
  } catch (error) {
    console.error('Failed to load language preference:', error);
  }
  // Default to Finnish
  return 'fi';
}

/**
 * React hook to subscribe to language changes and force re-render
 */
export function useTranslation() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    return subscribeToLanguageChange(() => {
      forceUpdate((prev) => prev + 1);
    });
  }, []);

  return { t, locale: currentLocale };
}
