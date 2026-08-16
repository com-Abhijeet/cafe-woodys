/**
 * Formats image URLs with Cloudinary dynamic transformation parameters (w_400,h_400,c_fill)
 */
export function getTransformedImageUrl(imageUrl, width = 400, height = 400) {
  if (!imageUrl) return null;

  if (imageUrl.includes('res.cloudinary.com') && imageUrl.includes('/upload/')) {
    return imageUrl.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
  }

  return imageUrl;
}
