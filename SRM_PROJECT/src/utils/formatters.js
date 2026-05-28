export const currency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export const number = (value) => new Intl.NumberFormat('en-US').format(value);

export const percent = (value) => `${value}%`;
