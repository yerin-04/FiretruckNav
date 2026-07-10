import React from 'react';
import { WebView } from 'react-native-webview';
import { kakaomapHtml } from './assets/kakaomapHtml';

function App() {
  return (
    <WebView
      source={{ html: kakaomapHtml, baseUrl: 'http://localhost' }}
      style={{ flex: 1 }}
      javaScriptEnabled={true}
      originWhitelist={['*']}
      onError={(syntheticEvent) => {
        console.log('WebView error: ', syntheticEvent.nativeEvent);
      }}
      onHttpError={(syntheticEvent) => {
        console.log('WebView HTTP error: ', syntheticEvent.nativeEvent);
      }}
    />
  );
}

export default App;