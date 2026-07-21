import React, { useEffect, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import type {
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
} from 'react-native-webview/lib/WebViewTypes';
import Geolocation from '@react-native-community/geolocation';
import { kakaomapHtml } from './assets/kakaomapHtml';
import { hydrants } from './assets/hydrants';

// 한 번에 너무 큰 injectJavaScript 페이로드를 보내면 WebView 브리지가 버벅이므로
// 소화전 데이터를 잘게 나눠서 순차적으로 보낸다.
const HYDRANT_CHUNK_SIZE = 300;
const HYDRANT_CHUNK_DELAY_MS = 30;

// react-native-webview's class typings default to React 18's JSX generics
// and don't resolve cleanly under React 19, so the element is cast loosely here.
const AnyWebView = WebView as unknown as React.ComponentType<any>;

async function requestLocationPermission() {
  if (Platform.OS !== 'android') {
    return true;
  }
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

function App() {
  const webViewRef = useRef<WebView>(null);
  // watchPosition may only fire once for a stationary/mock location (distanceFilter
  // never gets crossed again), so we keep the last fix to replay it once the WebView
  // finishes loading in case the injectJavaScript call raced ahead of window.updateTruckPosition.
  const lastPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // onLoadEnd가 WebView 재로딩 시 여러 번 불릴 수 있어, 소화전 데이터는 한 번만 보낸다.
  const hydrantsSentRef = useRef(false);

  const sendTruckPosition = (latitude: number, longitude: number) => {
    webViewRef.current?.injectJavaScript(
      `if (window.updateTruckPosition) { window.updateTruckPosition(${latitude}, ${longitude}); } true;`,
    );
  };

  const sendHydrantsChunked = () => {
    if (hydrantsSentRef.current) {
      return;
    }
    hydrantsSentRef.current = true;

    let offset = 0;
    const sendNextChunk = () => {
      const chunk = hydrants.slice(offset, offset + HYDRANT_CHUNK_SIZE);
      if (chunk.length === 0) {
        return;
      }
      webViewRef.current?.injectJavaScript(
        `if (window.addHydrants) { window.addHydrants(${JSON.stringify(chunk)}); } true;`,
      );
      offset += HYDRANT_CHUNK_SIZE;
      if (offset < hydrants.length) {
        setTimeout(sendNextChunk, HYDRANT_CHUNK_DELAY_MS);
      }
    };
    sendNextChunk();
  };

  useEffect(() => {
    let watchId: number | null = null;

    requestLocationPermission().then((hasPermission) => {
      if (!hasPermission) {
        console.log('Location permission denied');
        return;
      }

      watchId = Geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          lastPositionRef.current = { latitude, longitude };
          sendTruckPosition(latitude, longitude);
        },
        (error) => {
          console.log('Geolocation error: ', error);
        },
        { enableHighAccuracy: true, distanceFilter: 5 },
      );
    });

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return (
    <AnyWebView
      ref={webViewRef}
      source={{ html: kakaomapHtml, baseUrl: 'http://localhost' }}
      style={{ flex: 1 }}
      javaScriptEnabled={true}
      originWhitelist={['*']}
      onLoadEnd={() => {
        sendHydrantsChunked();
        if (lastPositionRef.current) {
          sendTruckPosition(
            lastPositionRef.current.latitude,
            lastPositionRef.current.longitude,
          );
        }
      }}
      onError={(syntheticEvent: WebViewErrorEvent) => {
        console.log('WebView error: ', syntheticEvent.nativeEvent);
      }}
      onHttpError={(syntheticEvent: WebViewHttpErrorEvent) => {
        console.log('WebView HTTP error: ', syntheticEvent.nativeEvent);
      }}
    />
  );
}

export default App;
