import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/components/ui';
import { SyncProvider } from '@/state/SyncContext';
import { UserProvider } from '@/state/UserContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <SyncProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#ffffff',
              },
              headerShadowVisible: false,
              headerTitleStyle: {
                fontWeight: '700',
                fontSize: 18,
                color: colors.text,
              },
              headerTintColor: colors.primary,
              headerBackTitleVisible: false,
              contentStyle: {
                backgroundColor: colors.background,
              },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="choose-user"
              options={{
                title: 'Choose Profile',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="schools"
              options={{
                title: 'Select School',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="visit-form"
              options={{
                title: 'New Visit Form',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="visits/index"
              options={{
                title: 'My Visits',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="visits/[clientId]"
              options={{
                title: 'Visit Details',
                headerShown: true,
              }}
            />
          </Stack>
        </SyncProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
