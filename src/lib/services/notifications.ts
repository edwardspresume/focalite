import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

async function ensureNotificationPermission(): Promise<boolean> {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
    }
    return permissionGranted;
}

export const notificationService = {
    async sendBreakStartNotification() {
        if (await ensureNotificationPermission()) {
            sendNotification({
                title: 'Break Time!',
                body: 'Time to take a break and recharge.'
            });
        }
    },

    async sendBreakEndNotification() {
        if (await ensureNotificationPermission()) {
            sendNotification({
                title: 'Break Ended',
                body: 'Break complete. Ready to focus again!'
            });
        }
    }
};
