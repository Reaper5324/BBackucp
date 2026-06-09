import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE, VALIDATION } from '../config.js';

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export function validatePassword(password) {
  return String(password || '').length >= VALIDATION.MIN_PASSWORD_LENGTH;
}

export function validateRequired(value) {
  return String(value ?? '').trim().length > 0;
}

export function validateNumber(value, min = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min;
}

export function validateImageFile(file, required = false) {
  if (!file) return required ? 'Please choose an image' : '';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Use a JPG, PNG, or GIF image';
  if (file.size > MAX_FILE_SIZE) return 'Image must be 5MB or smaller';
  return '';
}

export function validateProductForm(form) {
  const formData = new FormData(form);
  const errors = {};

  if (!validateRequired(formData.get('title'))) errors.title = 'Product title is required';
  if (!validateRequired(formData.get('category_id'))) errors.category = 'Choose a category';
  if (!validateNumber(formData.get('price'), 0.01)) errors.price = 'Enter a valid price';
  if (!validateNumber(formData.get('stock'), 1)) errors.stock = 'Enter at least 1 item in stock';
  if (!validateRequired(formData.get('description'))) errors.description = 'Description is required';

  const image = form.querySelector('input[type="file"]')?.files?.[0];
  const imageRequired = form.dataset.productId ? false : true;
  const imageError = validateImageFile(image, imageRequired);
  if (imageError) errors.image = imageError;

  return { valid: Object.keys(errors).length === 0, errors };
}
