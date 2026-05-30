import { registerRootComponent } from 'expo';
import App from './App';

try {
  const { enableScreens } = require('react-native-screens');
  enableScreens(false);
} catch {}

registerRootComponent(App);
