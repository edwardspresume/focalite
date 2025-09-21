import {
	isPermissionGranted,
	requestPermission,
	sendNotification,
} from '@tauri-apps/plugin-notification';

class NotificationService {
	private permissionGranted = false;

	async init() {
		this.permissionGranted = await isPermissionGranted();

		if (!this.permissionGranted) {
			const permission = await requestPermission();
			this.permissionGranted = permission === 'granted';
		}
	}

	async sendBreakStartNotification() {
		if (!this.permissionGranted) {
			await this.init();
		}

		if (this.permissionGranted) {
			sendNotification({
				title: 'Break Time!',
				body: 'Time to take a break and recharge.'
			});
		}
	}
}

export const notificationService = new NotificationService();