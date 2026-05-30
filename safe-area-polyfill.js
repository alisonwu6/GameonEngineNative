import React from 'react';
import { View } from 'react-native';

export const SafeAreaProvider = ({ children }) =>
  React.createElement(View, { style: { flex: 1 } }, children);

export const SafeAreaView = ({ children, style, ...props }) =>
  React.createElement(View, { style: [{ flex: 1 }, style], ...props }, children);

export const useSafeAreaInsets = () => ({ top: 44, bottom: 34, left: 0, right: 0 });
export const useSafeAreaFrame  = () => ({ x: 0, y: 0, width: 390, height: 844 });

export const SafeAreaInsetsContext = React.createContext({ top: 44, bottom: 34, left: 0, right: 0 });
export const SafeAreaFrameContext  = React.createContext({ x: 0, y: 0, width: 390, height: 844 });

export const initialWindowMetrics = {
  insets: { top: 44, bottom: 34, left: 0, right: 0 },
  frame:  { x: 0, y: 0, width: 390, height: 844 },
};
