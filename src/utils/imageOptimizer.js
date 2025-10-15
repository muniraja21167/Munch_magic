// Image optimization utilities for better performance

export const ImageCache = {
  cache: new Map(),
  
  // Cache management
  set(key, value) {
    if (this.cache.size >= 100) { // Limit cache size
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  },
  
  get(key) {
    return this.cache.get(key);
  },
  
  clear() {
    this.cache.clear();
  }
};

// Image URL optimization
export const getOptimizedImageUrl = (originalUrl, width = 300, height = 200, quality = 75) => {
  if (!originalUrl || originalUrl.includes('placeholder')) {
    return `https://via.placeholder.com/${width}x${height}/f0f0f0/999?text=Loading...`;
  }

  // Cache key for this specific image configuration
  const cacheKey = `${originalUrl}_${width}x${height}_q${quality}`;
  const cached = ImageCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let optimizedUrl = originalUrl;

  // Unsplash optimization
  if (originalUrl.includes('unsplash.com')) {
    optimizedUrl = `${originalUrl}&w=${width}&h=${height}&fit=crop&crop=center&auto=format&q=${quality}`;
  }
  
  // Cloudinary optimization (if you use Cloudinary)
  else if (originalUrl.includes('cloudinary.com')) {
    const parts = originalUrl.split('/upload/');
    if (parts.length === 2) {
      optimizedUrl = `${parts[0]}/upload/w_${width},h_${height},c_fill,q_${quality},f_auto/${parts[1]}`;
    }
  }
  
  // AWS S3 with ImageKit or similar service
  else if (originalUrl.includes('amazonaws.com')) {
    // Add query parameters for services like ImageKit
    optimizedUrl = `${originalUrl}?tr=w-${width},h-${height},q-${quality},f-auto`;
  }

  // Cache the result
  ImageCache.set(cacheKey, optimizedUrl);
  return optimizedUrl;
};

// Preload critical images
export const preloadImages = (imageUrls) => {
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};

// Image loading priorities based on position
export const getImagePriority = (index, isVisible = true) => {
  if (!isVisible) return 'low';
  if (index < 3) return 'high';
  if (index < 6) return 'normal';
  return 'low';
};

// Lazy loading intersection observer setup
export const createIntersectionObserver = (callback) => {
  if (typeof IntersectionObserver === 'undefined') {
    return null;
  }
  
  return new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
        }
      });
    },
    {
      rootMargin: '50px', // Load images 50px before they come into view
      threshold: 0.1
    }
  );
};
