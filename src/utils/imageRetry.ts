/**
 * Image loading utility with retry logic
 * Retries loading an image up to a specified number of times before giving up
 */

export interface ImageRetryOptions {
  maxRetries?: number
  retryDelay?: number
  onError?: () => void
  onSuccess?: () => void
}

/**
 * Handle image loading with retry logic
 * @param imgElement - The img element to load the image for
 * @param src - The image source URL
 * @param options - Retry options
 */
export function loadImageWithRetry(
  imgElement: HTMLImageElement,
  src: string,
  options: ImageRetryOptions = {}
): void {
  const {
    maxRetries = 2,
    retryDelay = 500,
    onError,
    onSuccess
  } = options

  let retryCount = 0

  const tryLoad = () => {
    const img = new Image()
    
    img.onload = () => {
      // Image loaded successfully, update the element
      imgElement.src = src
      if (onSuccess) onSuccess()
    }

    img.onerror = () => {
      retryCount++
      
      if (retryCount <= maxRetries) {
        // Retry after delay
        setTimeout(() => {
          tryLoad()
        }, retryDelay)
      } else {
        // Max retries reached, hide the image or show placeholder
        imgElement.style.display = 'none'
        // Or set to data URI for transparent pixel to maintain layout
        imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'
        if (onError) onError()
      }
    }

    img.src = src
  }

  tryLoad()
}

/**
 * Handle image error with retry logic (for use in onError handler)
 * @param e - The error event
 * @param maxRetries - Maximum number of retries (default: 2)
 * @param retryDelay - Delay between retries in ms (default: 500)
 */
export function handleImageErrorWithRetry(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  maxRetries: number = 2,
  retryDelay: number = 500
): void {
  const img = e.currentTarget
  const currentSrc = img.src
  const originalSrc = img.dataset.originalSrc || currentSrc
  
  // Store retry count in data attribute
  const retryCount = parseInt(img.dataset.retryCount || '0')
  
  // If this is the placeholder and it's failing, or we've exceeded max retries
  if (currentSrc.includes('placeholder-venue.jpg') || retryCount >= maxRetries) {
    // Max retries reached or placeholder failed, hide the image
    img.style.display = 'none'
    // Set to transparent pixel to maintain layout
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'
    return
  }
  
  // Increment retry count
  img.dataset.retryCount = String(retryCount + 1)
  
  // Retry after delay - try original source with cache busting
  setTimeout(() => {
    const separator = originalSrc.includes('?') ? '&' : '?'
    img.src = originalSrc + separator + `retry=${retryCount + 1}&t=${Date.now()}`
  }, retryDelay)
}

