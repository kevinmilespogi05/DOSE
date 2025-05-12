import Swal from 'sweetalert2';

export const showSuccessAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false
  });
};

export const showErrorAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text: text || 'Something went wrong. Please try again.',
    confirmButtonColor: '#3085d6'
  });
};

export const showWarningAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonColor: '#3085d6'
  });
};

export const showInfoAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonColor: '#3085d6'
  });
};

export const showConfirmAlert = (title: string, text: string, confirmButtonText = 'Yes', cancelButtonText = 'No') => {
  return Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText,
    cancelButtonText
  });
};

export const showFormValidationAlert = (errors: Record<string, string>) => {
  const errorList = Object.values(errors).map(error => `• ${error}`).join('<br>');
  
  return Swal.fire({
    icon: 'error',
    title: 'Validation Error',
    html: `<div class="text-left">${errorList}</div>`,
    confirmButtonColor: '#3085d6'
  });
}; 