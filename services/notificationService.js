let Notifications = null;
let Device = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {}

export const requestPermissions = async () => {
  try {
    if (!Notifications || !Device?.isDevice) return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

export const notifyBookingConfirmed = async ({ venueName, spaceName, date, timeSlot }) => {
  try {
    if (!Notifications) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Booking Confirmed!',
        body: `${spaceName} at ${venueName} — ${date} ${timeSlot}`,
      },
      trigger: null,
    });
  } catch {}
};
