import Swal from 'sweetalert2';

// Success alert with custom title and message
export const showSuccess = (title: string, message?: string) => {
  return Swal.fire({
    title,
    html: message,
    icon: 'success',
    confirmButtonColor: '#4F46E5',
    confirmButtonText: 'OK',
  });
};

// Error alert with custom title and message
export const showError = (title: string, message: string) => {
  return Swal.fire({
    title,
    html: message,
    icon: 'error',
    confirmButtonColor: '#4F46E5',
    confirmButtonText: 'OK',
  });
};

// Warning alert with custom title and message
export const showWarning = (title: string, message: string) => {
  return Swal.fire({
    title,
    html: message,
    icon: 'warning',
    confirmButtonColor: '#4F46E5',
    confirmButtonText: 'OK',
  });
};

// Information alert with custom title and message
export const showInfo = (title: string, message: string) => {
  return Swal.fire({
    title,
    html: message,
    icon: 'info',
    confirmButtonColor: '#4F46E5',
    confirmButtonText: 'OK',
  });
};

// Confirmation dialog with custom title and message
export const showConfirmation = (title: string, message: string, confirmButtonText = 'Yes', cancelButtonText = 'No') => {
  return Swal.fire({
    title,
    html: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#4F46E5',
    cancelButtonColor: '#EF4444',
    confirmButtonText,
    cancelButtonText,
  });
};

// Toast notification that auto-closes
export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  return Swal.fire({
    title,
    icon,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
};

// Loading indicator with optional text
export const showLoading = (title = 'Loading...') => {
  return Swal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close the currently active alert
export const closeAlert = () => {
  Swal.close();
}; 