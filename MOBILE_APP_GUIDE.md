# FarmKonnect Mobile App - React Native Implementation Guide

## Overview

This guide provides complete instructions for building the FarmKonnect mobile app using React Native with Expo. The mobile app will connect to the existing tRPC backend and provide offline-first functionality for farmers in areas with limited connectivity.

---

## Tech Stack

- **Framework:** React Native with Expo
- **API Client:** tRPC React Native adapter
- **State Management:** TanStack Query (React Query)
- **Navigation:** React Navigation
- **Offline Storage:** AsyncStorage + WatermelonDB
- **Authentication:** Manus OAuth (web-based flow)
- **UI Components:** React Native Paper / NativeBase
- **Maps:** react-native-maps
- **Camera:** expo-camera
- **Push Notifications:** Expo Notifications

---

## Project Setup

### 1. Initialize Expo Project

```bash
# Create new Expo project
npx create-expo-app farmkonnect-mobile --template blank-typescript

cd farmkonnect-mobile

# Install core dependencies
npm install @trpc/client @trpc/react-query @tanstack/react-query
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-paper react-native-vector-icons
npm install @react-native-async-storage/async-storage
npm install expo-location expo-camera expo-image-picker
npm install react-native-maps
```

### 2. Configure tRPC Client

Create `src/lib/trpc.ts`:

```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server/routers'; // Import from web app

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'https://your-domain.manus.space/api/trpc',
      headers: async () => {
        // Get auth token from AsyncStorage
        const token = await AsyncStorage.getItem('auth_token');
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
    }),
  ],
});
```

### 3. Setup App Providers

Create `App.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from './src/lib/trpc';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';

const queryClient = new QueryClient();

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </PaperProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

---

## App Structure

```
farmkonnect-mobile/
├── App.tsx
├── app.json
├── package.json
├── src/
│   ├── components/
│   │   ├── FarmCard.tsx
│   │   ├── CropCard.tsx
│   │   ├── LivestockCard.tsx
│   │   ├── WeatherWidget.tsx
│   │   └── OfflineIndicator.tsx
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── farms/
│   │   │   ├── FarmsListScreen.tsx
│   │   │   ├── FarmDetailScreen.tsx
│   │   │   └── AddFarmScreen.tsx
│   │   ├── crops/
│   │   │   ├── CropsListScreen.tsx
│   │   │   └── AddCropScreen.tsx
│   │   ├── livestock/
│   │   │   ├── LivestockListScreen.tsx
│   │   │   └── AddAnimalScreen.tsx
│   │   ├── weather/
│   │   │   └── WeatherScreen.tsx
│   │   ├── marketplace/
│   │   │   ├── MarketplaceScreen.tsx
│   │   │   └── ProductDetailScreen.tsx
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   └── TabNavigator.tsx
│   ├── lib/
│   │   ├── trpc.ts
│   │   ├── storage.ts
│   │   └── offline.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useLocation.ts
│   │   └── useOfflineSync.ts
│   └── types/
│       └── index.ts
```

---

## Key Features Implementation

### 1. Authentication

```typescript
// src/screens/auth/LoginScreen.tsx
import { trpc } from '../../lib/trpc';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      // Navigate to home
    },
  });

  // Implement Manus OAuth web flow with WebBrowser
  const handleLogin = async () => {
    const result = await WebBrowser.openAuthSessionAsync(
      'https://your-domain.manus.space/api/oauth/authorize',
      'farmkonnect://auth-callback'
    );
    
    if (result.type === 'success') {
      // Extract token from callback URL
      const token = extractTokenFromURL(result.url);
      await AsyncStorage.setItem('auth_token', token);
    }
  };

  return (
    <View>
      <Button onPress={handleLogin}>Login with Manus</Button>
    </View>
  );
}
```

### 2. Farm Management

```typescript
// src/screens/farms/FarmsListScreen.tsx
import { trpc } from '../../lib/trpc';

export default function FarmsListScreen() {
  const { data: farms, isLoading } = trpc.farms.list.useQuery();
  const utils = trpc.useUtils();

  const deleteFarm = trpc.farms.delete.useMutation({
    onSuccess: () => {
      utils.farms.list.invalidate();
    },
  });

  return (
    <FlatList
      data={farms}
      renderItem={({ item }) => (
        <FarmCard 
          farm={item}
          onPress={() => navigation.navigate('FarmDetail', { id: item.id })}
          onDelete={() => deleteFarm.mutate({ id: item.id })}
        />
      )}
    />
  );
}
```

### 3. GPS Location Picker

```typescript
// src/components/LocationPicker.tsx
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

export default function LocationPicker({ onLocationSelect }) {
  const [location, setLocation] = useState(null);

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      onLocationSelect(loc.coords);
    }
  };

  return (
    <View>
      <MapView
        initialRegion={{
          latitude: location?.latitude || 5.6037,
          longitude: location?.longitude || -0.1870,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={(e) => {
          setLocation(e.nativeEvent.coordinate);
          onLocationSelect(e.nativeEvent.coordinate);
        }}
      >
        {location && <Marker coordinate={location} />}
      </MapView>
      <Button onPress={getCurrentLocation}>Use Current Location</Button>
    </View>
  );
}
```

### 4. Offline Support

```typescript
// src/lib/offline.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export class OfflineQueue {
  private queue: any[] = [];

  async addToQueue(action: any) {
    this.queue.push(action);
    await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue));
  }

  async processQueue() {
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (isConnected && this.queue.length > 0) {
      for (const action of this.queue) {
        try {
          // Execute queued action
          await action.execute();
          this.queue = this.queue.filter(a => a.id !== action.id);
        } catch (error) {
          console.error('Failed to process queued action:', error);
        }
      }
      await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue));
    }
  }
}

// Usage in components
const offlineQueue = new OfflineQueue();

const createFarm = trpc.farms.create.useMutation({
  onError: async (error, variables) => {
    // If offline, queue the action
    await offlineQueue.addToQueue({
      id: Date.now(),
      type: 'createFarm',
      data: variables,
      execute: () => createFarm.mutateAsync(variables),
    });
  },
});
```

### 5. Camera Integration

```typescript
// src/components/PhotoCapture.tsx
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export default function PhotoCapture({ onPhotoTaken }) {
  const [hasPermission, setHasPermission] = useState(null);

  const takePicture = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled) {
        onPhotoTaken(result.assets[0].uri);
      }
    }
  };

  return (
    <Button onPress={takePicture}>Take Photo</Button>
  );
}
```

### 6. Push Notifications

```typescript
// src/lib/notifications.ts
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig.extra.eas.projectId,
  })).data;

  return token;
}

// Send token to backend
const savePushToken = trpc.notifications.savePushToken.useMutation();
const token = await registerForPushNotificationsAsync();
if (token) {
  savePushToken.mutate({ token });
}
```

---

## Navigation Structure

```typescript
// src/navigation/TabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Farms" 
        component={FarmsListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Livestock" 
        component={LivestockListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Weather" 
        component={WeatherScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cloud" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

---

## Build & Deployment

### Development Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Create development build
eas build --profile development --platform android
eas build --profile development --platform ios
```

### Production Build

```bash
# Android APK
eas build --profile production --platform android

# iOS App Store
eas build --profile production --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Over-the-Air Updates

```bash
# Publish update
eas update --branch production --message "Bug fixes and improvements"
```

---

## Testing

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react-native jest

# Run tests
npm test

# E2E testing with Detox
npm install --save-dev detox
detox test
```

---

## Performance Optimization

1. **Image Optimization:**
   - Use expo-image for optimized image loading
   - Implement lazy loading for lists
   - Cache images locally

2. **Data Syncing:**
   - Implement incremental sync
   - Use background fetch for periodic updates
   - Compress API responses

3. **Bundle Size:**
   - Use Hermes engine
   - Enable ProGuard for Android
   - Implement code splitting

---

## Security

1. **Secure Storage:**
   ```typescript
   import * as SecureStore from 'expo-secure-store';
   
   await SecureStore.setItemAsync('auth_token', token);
   const token = await SecureStore.getItemAsync('auth_token');
   ```

2. **API Security:**
   - Use HTTPS only
   - Implement certificate pinning
   - Validate all user inputs

3. **Biometric Authentication:**
   ```typescript
   import * as LocalAuthentication from 'expo-local-authentication';
   
   const result = await LocalAuthentication.authenticateAsync();
   if (result.success) {
     // Grant access
   }
   ```

---

## Next Steps

1. ✅ Set up Expo project
2. ✅ Configure tRPC client
3. ✅ Implement authentication flow
4. ✅ Build core screens (Farms, Crops, Livestock)
5. ✅ Add offline support
6. ✅ Implement camera integration
7. ✅ Set up push notifications
8. ✅ Add GPS/Maps functionality
9. ⬜ Test on physical devices
10. ⬜ Submit to app stores

---

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [tRPC React Native](https://trpc.io/docs/client/react/setup)
- [React Navigation](https://reactnavigation.org/)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)

---

## Support

For issues or questions:
- GitHub: https://github.com/farmkonnect/mobile
- Email: support@farmkonnect.com
- Slack: #mobile-app
