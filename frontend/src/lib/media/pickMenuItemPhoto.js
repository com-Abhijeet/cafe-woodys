import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export async function pickMenuItemPhoto() {
  if (!Capacitor.isNativePlatform()) {
    return null; // web build falls through to standard <input type="file"> flow
  }

  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt, // Native action sheet choice: Camera or Photo Library
      quality: 80,
      allowEditing: false
    });
    return photo;
  } catch (err) {
    if (err?.message !== 'User cancelled photos app') {
      console.warn('Camera photo picker cancelled or failed:', err?.message || err);
    }
    return null;
  }
}
