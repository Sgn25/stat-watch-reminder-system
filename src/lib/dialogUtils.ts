// Utility functions for dialog management

let scrollLockCount = 0;
let originalOverflow: string | null = null;
let originalPaddingRight: string | null = null;

export const lockBodyScroll = () => {
  scrollLockCount++;
  
  if (scrollLockCount === 1) {
    originalOverflow = document.body.style.overflow;
    originalPaddingRight = document.body.style.paddingRight;
    
    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.setAttribute('data-dialog-open', 'true');
    
    // Ensure the dialog container is properly positioned
    document.documentElement.style.setProperty('--dialog-scroll-top', `${window.scrollY}px`);
  }
};

export const unlockBodyScroll = () => {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  
  if (scrollLockCount === 0) {
    document.body.style.overflow = originalOverflow || '';
    document.body.style.paddingRight = originalPaddingRight || '';
    document.body.removeAttribute('data-dialog-open');
    document.documentElement.style.removeProperty('--dialog-scroll-top');
    originalOverflow = null;
    originalPaddingRight = null;
  }
};

export const resetBodyScroll = () => {
  scrollLockCount = 0;
  document.body.style.overflow = originalOverflow || '';
  document.body.style.paddingRight = originalPaddingRight || '';
  document.body.removeAttribute('data-dialog-open');
  document.documentElement.style.removeProperty('--dialog-scroll-top');
  originalOverflow = null;
  originalPaddingRight = null;
};

// Get current scroll lock count for debugging
export const getScrollLockCount = () => scrollLockCount;

// Cleanup function to be called on component unmount
export const cleanupBodyScroll = () => {
  // Reset everything if there are any remaining locks
  if (scrollLockCount > 0) {
    resetBodyScroll();
  }
};