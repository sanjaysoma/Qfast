import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, NativeModules, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const runtimeHost = useMemo(() => {
    const sourceUrl = NativeModules.SourceCode?.scriptURL || Constants.linkingUri || '';

    try {
      if (sourceUrl) {
        return new URL(sourceUrl).hostname;
      }
    } catch {
      const hostMatch = sourceUrl.match(/^(?:exp|https?):\/\/([^/:]+)/i);
      if (hostMatch?.[1]) {
        return hostMatch[1];
      }
    }

    return null;
  }, []);

  const defaultBackendUrl = useMemo(() => {
    const configuredUrl = Constants.expoConfig?.extra?.BACKEND_URL;
    if (configuredUrl && typeof configuredUrl === 'string' && configuredUrl.trim()) {
      return configuredUrl.trim();
    }

    if (runtimeHost && !['localhost', '127.0.0.1'].includes(runtimeHost)) {
      return `http://${runtimeHost}:8000`;
    }

    return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
  }, [runtimeHost]);

  const webViewSource = useMemo(() => {
    const configuredWebUrl = Constants.expoConfig?.extra?.WEB_URL;
    const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

    if (configuredWebUrl && typeof configuredWebUrl === 'string' && configuredWebUrl.trim()) {
      return { uri: configuredWebUrl.trim() };
    }

    if ((__DEV__ || isExpoGo) && runtimeHost && !['localhost', '127.0.0.1'].includes(runtimeHost)) {
      return { uri: `http://${runtimeHost}:5173` };
    }

    return { uri: 'file:///android_asset/web/index.html' };
  }, [runtimeHost]);

  const webViewRef = useRef(null);
  const [backendUrl, setBackendUrl] = useState(defaultBackendUrl);
  const [inputValue, setInputValue] = useState(defaultBackendUrl);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('checking');
  const [permissionMessage, setPermissionMessage] = useState(null);

  useEffect(() => {
    let active = true;
    let locationSubscription = null;

    const HIGH_ACCURACY_OPTIONS = {
      accuracy: Platform.OS === 'android' ? Location.Accuracy.Highest : Location.Accuracy.BestForNavigation,
    };

    const WATCH_ACCURACY_OPTIONS = {
      accuracy: Platform.OS === 'android' ? Location.Accuracy.High : Location.Accuracy.BestForNavigation,
      timeInterval: 10000,
      distanceInterval: 10,
    };

    const requestPermission = async () => {
      try {
        if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
          if (active) {
            setPermissionStatus('granted');
          }
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!active) {
          return;
        }

        setPermissionStatus(status);
        if (status !== 'granted') {
          setPermissionMessage('Please allow location access so QFast can detect your city.');
          return;
        }

        if (Platform.OS === 'android') {
          try {
            await Location.enableNetworkProviderAsync();
          } catch {
            // Ignore if provider prompt is dismissed; we'll still use best available fix.
          }
        }

        setPermissionMessage(null);

        const sendLocationToWebView = (location) => {
          const payload = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy ?? null,
            source: 'native',
            timestamp: location.timestamp,
          };

          const script = `
            (function() {
              try {
                window.__QFast_MOBILE_LOCATION__ = ${JSON.stringify(payload)};
                window.dispatchEvent(new CustomEvent('QFast-native-location', { detail: ${JSON.stringify(payload)} }));
              } catch (e) {}
            })();
            true;
          `;

          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(script);
          }
        };

        const initialPosition = await Location.getCurrentPositionAsync(HIGH_ACCURACY_OPTIONS);
        if (active) {
          sendLocationToWebView(initialPosition);
        }

        locationSubscription = await Location.watchPositionAsync(
          WATCH_ACCURACY_OPTIONS,
          (location) => {
            if (active) {
              sendLocationToWebView(location);
            }
          }
        );
      } catch (error) {
        if (active) {
          setPermissionStatus('error');
          setPermissionMessage('Unable to request location permission.');
        }
      }
    };

    requestPermission();

    return () => {
      active = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const injectedJavaScriptBeforeContentLoaded = useMemo(
    () => `
      (function() {
        var runtimeBackendUrl = ${JSON.stringify(backendUrl)};
        if (runtimeBackendUrl) {
          window.__QFast_API_BASE_URL__ = runtimeBackendUrl;
          window.__QFast_LOCATION_ENABLED__ = true;
          try {
            localStorage.setItem('api_base_url', runtimeBackendUrl);
          } catch (e) {}
        }
      })();
      true;
    `,
    [backendUrl],
  );

  const handleRetry = () => {
    setLoadError(null);
    setLoading(true);
  };

  const handlePermissionRetry = async () => {
    setPermissionMessage(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status !== 'granted') {
          setPermissionMessage('Please allow location access so QFast can detect your city.');
      }
    } catch (error) {
      setPermissionStatus('error');
      setPermissionMessage('Unable to request location permission.');
    }
  };

  if (permissionStatus !== 'granted' && permissionStatus !== 'checking') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.content}>
          <Text style={styles.title}>QFast</Text>
          <Text style={styles.subtitle}>Location access required</Text>
          <Text style={styles.body}>{permissionMessage || 'Please enable location permission to detect your city.'}</Text>
          <Pressable style={styles.button} onPress={handlePermissionRetry}>
            <Text style={styles.buttonText}>Allow location</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {loadError ? (
        <View style={styles.content}>
          <Text style={styles.title}>QFast</Text>
          <Text style={styles.subtitle}>Unable to load QFast.</Text>
          <Text style={styles.body}>{loadError}</Text>
          <Text style={styles.helper}>
            Enter the backend URL for your computer or emulator. When using Expo Go, also make sure the frontend is running on port 5173 on the same computer.
          </Text>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://192.168.x.x:8000"
            placeholderTextColor="#9ca3af"
          />
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                setInputValue(defaultBackendUrl);
              }}
            >
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() => {
                setBackendUrl(inputValue.trim());
                handleRetry();
              }}
            >
              <Text style={styles.buttonText}>Retry</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={webViewSource}
          originWhitelist={['*']}
          startInLoadingState={true}
          injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
          geolocationEnabled={true}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.body}>Loading QFast...</Text>
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="always"
          onError={(event) => {
            setLoadError(event.nativeEvent.description || 'Unknown WebView error');
            setLoading(false);
          }}
          onHttpError={(event) => {
            setLoadError(`Web app returned HTTP ${event.nativeEvent.statusCode}`);
            setLoading(false);
          }}
          onLoadEnd={() => {
            setLoading(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    textAlign: 'center',
    maxWidth: 560,
  },
  helper: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 560,
  },
  input: {
    width: '100%',
    maxWidth: 560,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
    maxWidth: 560,
    justifyContent: 'center',
  },
  button: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '700',
  },
});

