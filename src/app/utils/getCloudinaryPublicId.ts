export function getCloudinaryPublicId(url: string): string | null {
  try {
    const cleanUrl = url.split('?')[0]; // remove query params if any
    const uploadIndex = cleanUrl.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    // Everything after /upload/ and version
    const publicId = cleanUrl
      .substring(uploadIndex + 8)
      .replace(/^v\d+\//, '') // remove version (v123456/)
      .replace(/\.[^/.]+$/, ''); // remove extension

    return publicId;
  } catch {
    return null;
  }
}

