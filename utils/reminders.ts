import * as Notifications from "expo-notifications";

let handlerConfigured = false;

export const configureNotifications = () => {
  if (handlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  handlerConfigured = true;
};

export const ensureNotificationPermission = async () => {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
};

export const scheduleReminder = async (
  reminderAt: string | null,
  title: string,
  body: string,
) => {
  if (!reminderAt) {
    return null;
  }

  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) {
    return null;
  }

  const date = new Date(reminderAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
};

export const cancelReminder = async (notificationId: string | null) => {
  if (!notificationId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
};
