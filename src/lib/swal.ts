import Swal from 'sweetalert2';

// We want a dark theme for SweetAlert2 matching our global elegant dark theme
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#1a1a1a',
  color: '#e5e7eb',
  customClass: {
    popup: 'swal2-dark-popup',
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

export const Alert = Swal.mixin({
  background: '#1a1a1a',
  color: '#e5e7eb',
  confirmButtonColor: '#3b82f6',
  cancelButtonColor: '#ef4444',
  customClass: {
    popup: 'swal2-dark-popup',
  }
});
