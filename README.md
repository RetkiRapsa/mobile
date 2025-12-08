# RetkiRapsa Mobile

A cross-platform mobile application built with React Native and TypeScript.

## Features

- Modern UI with React Native
- TypeScript for type safety
- State management with React

## Getting Started

### Prerequisites

- Node.js & npm
- NPX
- React Native CLI
- Xcode (macOS) or Android Studio
- Expo CLI

### Configuration

To connect the app to a specific backend server, create `.env.local` file in the root directory with the following
content:

    EXPO_PUBLIC_RETKIRAPSA_API_DOMAIN=<RETKIRAPSA_API_DOMAIN>

- VPS Instance: api.retkirapsa.com
- Local Network Instance for iPhone via Expo Go: 192.168.8.160

### Running the App

    $ npx expo start

### Expo Application Services (EAS)

Build and submit:

    $ eas build --platform ios
    $ eas submit -p ios --latest

    $ eas build --platform android
    $ eas submit -p android --latest

    https://appstoreconnect.apple.com
