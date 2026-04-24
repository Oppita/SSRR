export const showAlert = (message: string) => {
  window.dispatchEvent(new CustomEvent('show-alert', { detail: message }));
};
