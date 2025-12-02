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

To connect the app to the backend server, update the `BASE_URL` in `utils/client.ts` with the appropriate IP
address.

- AWS EC2 Instance: 13.62.228.65
- Local Network Instance for iPhone via Expo Go: 192.168.8.160

### Running the App

    $ npx expo start

### Expo Application Services (EAS)

    $ eas build --platform ios
    $ eas submit -p ios --latest

    https://appstoreconnect.apple.com
