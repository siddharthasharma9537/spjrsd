// Photos are shrunk in the browser before upload (long side 1600px, JPEG), so
// phone pictures upload quickly over mobile data and storage stays small.
// JPEG output also keeps Live Blog photos eligible for Instagram sharing.
const MAX_SIDE = 1600;

export async function shrinkImage(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob ? new File([blob], 'image.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}
