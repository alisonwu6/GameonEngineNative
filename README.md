# GameOnEngine — Mobile App (IFN666 Assessment 3)

## 1 - The purpose of the application

GameOnEngine is a React Native mobile app for booking sports venues. It is the mobile client for the GameOnEngine REST API built in Assessment 2.

Players can browse sports venues, pick a date and time slot, and make a booking. Venue managers can create and manage their venues, add spaces, and review incoming bookings.

The mobile app covers the same features as the Assessment 2 web app, redesigned native device features, push notifications and camera access.


## 2 - A description of how to contribute to the development of the application

1. Fork this repository and create a new branch for your feature or fix.
2. Install dependencies with `npm install`.
3. Start the development server with `npx expo start --clear` and test changes in Expo Go or a simulator.
4. For features that use native modules (camera, notifications), build a dev client with `npx expo run:ios` before testing.
5. Keep API logic in the `services/` layer, do not call `fetch` directly inside screen components.
6. Submit a pull request with a clear description of the change and the reason for it.


## 3 - A list of dependencies and how to install them

### Dependencies installed

| Package | Version | Purpose |
|---|---|---|
| expo | ~54.0.35 | Expo SDK and tooling |
| react | 19.1.0 | UI framework |
| react-native | 0.81.5 | Mobile runtime |
| expo-image-picker | ~17.0.11 | Camera and photo library access |
| expo-notifications | ~0.32.17 | Local push notifications |
| expo-device | ~8.0.10 | Device detection for notifications |
| expo-dev-client | ~6.0.21 | Dev build support for native modules |
| expo-status-bar | ~3.0.9 | Status bar control |
| @react-native-community/datetimepicker | 8.4.4 | Native date picker |
| react-native-safe-area-context | ~5.6.0 | Safe area insets |
| react-native-screens | ~4.16.0 | Native screen management |

### Install Steps

1. Open the server folder
```bash
cd GameonEngineEngineNative
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npx expo start --clear
```

## 4 - A description of the applications architecture

```
.
├── App.js                      # Root component, custom tab navigator
├── index.js                    # Entry point (Expo registerRootComponent)
├── app.json                    # Expo config (splash, icons, permissions)
├── metro.config.js             # Metro bundler config (safe-area polyfill alias)
├── safe-area-polyfill.js       # Pure JS fallback for react-native-safe-area-context
│    
├── context/    
│   └── AuthContext.js          # Auth state (token, user), login/logout
│    
├── services/                   # All API calls live here, never inside components
│   ├── api.js                  # Base URL, shared fetch helpers
│   ├── authService.js          # login, register, getMe
│   ├── venueService.js         # CRUD for venues, logo upload
│   ├── spaceService.js         # CRUD for spaces within a venue
│   ├── bookingService.js       # Create, list, update, delete bookings
│   └── notificationService.js  # Local push notifications
│
├── screens/
│   ├── AuthScreen.js           # Login and registration
│   ├── ExploreScreen.js        # Browse and search all venues
│   ├── VenueScreen.js          # Venue detail, booking, and manager tools
│   ├── BookingsScreen.js       # Player's bookings/manager's incoming bookings
│   └── ProfileScreen.js        # Account info, manager's venue list, create venue
│    
└── components/    
    ├── VenueCard.js            # Reusable venue list item
    └── BookingCard.js          # Reusable booking list item with status controls
```

### API

The app connects to the Assessment 2 REST API at `https://wombat04.ifn666.com/assessment02/api`. All requests go over HTTPS. Authentication uses JWT Bearer tokens held in memory. If the API is unreachable, each screen shows an error message and a Retry button, the app does not crash.


## 5. How to Report Issues

To report a bug or request a feature, open an issue on the repository with the following information:

- A description of the problem or request
- Steps to reproduce (for bugs)
- Expected behaviour vs actual behaviour
- Device and OS version (e.g. iPhone 15, iOS 18)
- Whether you are using Expo Go or a dev build
