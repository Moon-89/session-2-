/**
 * Registration Form - script.js
 * Real-time client-side validation with error messages,
 * password checklist, toggle visibility, and success modal.
 */

'use strict';

// ============================================================
// DOM References
// ============================================================
const form           = document.getElementById('registration-form');
const submitBtn      = document.getElementById('submit-btn');
const btnText        = submitBtn.querySelector('.btn-text');
const spinner        = submitBtn.querySelector('.spinner');
const successModal   = document.getElementById('success-modal');
const closeModalBtn  = document.getElementById('close-modal-btn');

const fields = {
  name:            document.getElementById('full-name'),
  email:           document.getElementById('email'),
  phone:           document.getElementById('phone'),
  password:        document.getElementById('password'),
  confirmPassword: document.getElementById('confirm-password'),
};

const errors = {
  name:            document.getElementById('name-error'),
  email:           document.getElementById('email-error'),
  phone:           document.getElementById('phone-error'),
  password:        document.getElementById('password-error'),
  confirmPassword: document.getElementById('confirm-password-error'),
};

const statuses = {
  name:            document.getElementById('name-status'),
  email:           document.getElementById('email-status'),
  phone:           document.getElementById('phone-status'),
};



// ============================================================
// Regex Patterns
// ============================================================
const PATTERNS = {
  // Alphabetic characters and spaces, min 3 chars, max 60
  name:    /^[A-Za-z\s'\-]{3,60}$/,
  // Standard email validation
  email:   /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
  // Accepts 7-15 digits, optionally preceded by + and country code spaces/dashes
  phone:   /^[\+]?[\s.\-]?[(]?[0-9]{1,4}[)]?[\s.\-]?[0-9]{3,5}[\s.\-]?[0-9]{3,5}[\s.\-]?[0-9]{0,5}$/,
  // Password sub-rules
  pwdUppercase: /[A-Z]/,
  pwdLowercase: /[a-z]/,
  pwdNumber:    /[0-9]/,
  pwdSpecial:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,
};

// ============================================================
// Helper: Set field state (valid / invalid / neutral)
// ============================================================
/**
 * @param {'name'|'email'|'phone'|'password'|'confirmPassword'} fieldKey
 * @param {'valid'|'invalid'|'neutral'} state
 * @param {string} [message] - Error message for invalid state
 */
function setFieldState(fieldKey, state, message = '') {
  const input = fields[fieldKey];
  const errorEl = errors[fieldKey];
  const statusEl = statuses[fieldKey];  // may be undefined for password/confirm

  // Clear all state classes
  input.classList.remove('is-valid', 'is-invalid');
  if (statusEl) {
    statusEl.classList.remove('show-valid', 'show-invalid');
    statusEl.textContent = '';
  }
  errorEl.textContent = '';
  errorEl.classList.remove('visible');

  if (state === 'valid') {
    input.classList.add('is-valid');
    if (statusEl) {
      statusEl.textContent = '✓';
      statusEl.classList.add('show-valid');
    }
  } else if (state === 'invalid') {
    input.classList.add('is-invalid');
    if (statusEl) {
      statusEl.textContent = '✗';
      statusEl.classList.add('show-invalid');
    }
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
  // 'neutral' — all cleared, no state applied
}

// ============================================================
// Individual Validators
// ============================================================

function validateName() {
  const val = fields.name.value.trim();
  if (val === '') {
    setFieldState('name', 'invalid', 'Full name is required.');
    return false;
  }
  if (val.length < 3) {
    setFieldState('name', 'invalid', 'Name must be at least 3 characters long.');
    return false;
  }
  if (val.length > 60) {
    setFieldState('name', 'invalid', 'Name cannot exceed 60 characters.');
    return false;
  }
  if (!PATTERNS.name.test(val)) {
    setFieldState('name', 'invalid', 'Name may only contain letters, spaces, hyphens, or apostrophes.');
    return false;
  }
  setFieldState('name', 'valid');
  return true;
}

function validateEmail() {
  const val = fields.email.value.trim();
  if (val === '') {
    setFieldState('email', 'invalid', 'Email address is required.');
    return false;
  }
  if (!PATTERNS.email.test(val)) {
    setFieldState('email', 'invalid', 'Please enter a valid email address (e.g. name@domain.com).');
    return false;
  }
  setFieldState('email', 'valid');
  return true;
}

function validatePhone() {
  // Strip all spaces, dashes, dots, brackets for length check
  const raw = fields.phone.value.trim();
  if (raw === '') {
    setFieldState('phone', 'invalid', 'Phone number is required.');
    return false;
  }
  const stripped = raw.replace(/[\s\-().+]/g, '');
  if (!/^\d+$/.test(stripped)) {
    setFieldState('phone', 'invalid', 'Phone number may only contain digits, spaces, +, -, ( ).');
    return false;
  }
  if (stripped.length < 7 || stripped.length > 15) {
    setFieldState('phone', 'invalid', 'Phone number must be between 7 and 15 digits.');
    return false;
  }
  setFieldState('phone', 'valid');
  return true;
}

function validatePassword() {
  const val = fields.password.value;
  if (val === '') {
    setFieldState('password', 'invalid', 'Password is required.');
    return false;
  }

  // Collect all unmet requirements
  const unmet = [];
  if (val.length < 8)                                                          unmet.push('at least 8 characters');
  if (!PATTERNS.pwdUppercase.test(val) || !PATTERNS.pwdLowercase.test(val))   unmet.push('uppercase & lowercase letters');
  if (!PATTERNS.pwdNumber.test(val))                                           unmet.push('at least one number');
  if (!PATTERNS.pwdSpecial.test(val))                                          unmet.push('a special character (e.g. !@#$%)');

  if (unmet.length > 0) {
    const msg = 'Password must include: ' + unmet.join(', ') + '.';
    setFieldState('password', 'invalid', msg);
    return false;
  }

  setFieldState('password', 'valid');
  return true;
}

function validateConfirmPassword() {
  const val = fields.confirmPassword.value;
  const passwordVal = fields.password.value;
  if (val === '') {
    setFieldState('confirmPassword', 'invalid', 'Please confirm your password.');
    return false;
  }
  if (val !== passwordVal) {
    setFieldState('confirmPassword', 'invalid', 'Passwords do not match. Please try again.');
    return false;
  }
  setFieldState('confirmPassword', 'valid');
  return true;
}

// ============================================================
// Real-Time Event Listeners
// ============================================================

// Validate name on input (debounced) and on blur
let nameTimer;
fields.name.addEventListener('input', () => {
  clearTimeout(nameTimer);
  nameTimer = setTimeout(validateName, 400);
});
fields.name.addEventListener('blur', validateName);

// Validate email on input (debounced) and on blur
let emailTimer;
fields.email.addEventListener('input', () => {
  clearTimeout(emailTimer);
  emailTimer = setTimeout(validateEmail, 400);
});
fields.email.addEventListener('blur', validateEmail);

// Validate phone on input and on blur
let phoneTimer;
fields.phone.addEventListener('input', () => {
  clearTimeout(phoneTimer);
  phoneTimer = setTimeout(validatePhone, 400);
});
fields.phone.addEventListener('blur', validatePhone);

// Validate password on input (real-time checklist update)
fields.password.addEventListener('input', () => {
  validatePassword();
  // Also re-validate confirm if it has content
  if (fields.confirmPassword.value.length > 0) {
    validateConfirmPassword();
  }
});
fields.password.addEventListener('blur', validatePassword);

// Validate confirm password on input and blur
fields.confirmPassword.addEventListener('input', validateConfirmPassword);
fields.confirmPassword.addEventListener('blur', validateConfirmPassword);

// ============================================================
// Toggle Password Visibility
// ============================================================
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    const eyeOff = btn.querySelector('.eye-off');
    const eyeOn  = btn.querySelector('.eye-on');

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    eyeOff.classList.toggle('hidden', isPassword);
    eyeOn.classList.toggle('hidden', !isPassword);

    btn.setAttribute('aria-label', isPassword ? 'Hide Password' : 'Show Password');
  });
});

// ============================================================
// Form Submission
// ============================================================
form.addEventListener('submit', (e) => {
  e.preventDefault();

  // Run all validators and collect results
  const results = [
    validateName(),
    validateEmail(),
    validatePhone(),
    validatePassword(),
    validateConfirmPassword(),
  ];

  const allValid = results.every(Boolean);

  if (!allValid) {
    // Scroll to the first invalid input
    const firstInvalid = form.querySelector('.is-invalid');
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus();
    }
    return;
  }

  // All valid — simulate async submission
  setLoadingState(true);

  setTimeout(() => {
    setLoadingState(false);
    showSuccessModal();
    form.reset();
    // Reset all field states
    Object.keys(fields).forEach(key => setFieldState(key, 'neutral'));
  }, 1800);
});

// ============================================================
// Loading State
// ============================================================
function setLoadingState(isLoading) {
  submitBtn.disabled = isLoading;
  btnText.classList.toggle('hidden', isLoading);
  spinner.classList.toggle('hidden', !isLoading);
}

// ============================================================
// Success Modal
// ============================================================
function showSuccessModal() {
  successModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function hideSuccessModal() {
  successModal.classList.add('hidden');
  document.body.style.overflow = '';
}

closeModalBtn.addEventListener('click', hideSuccessModal);

// Close modal on overlay click
successModal.addEventListener('click', (e) => {
  if (e.target === successModal) {
    hideSuccessModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !successModal.classList.contains('hidden')) {
    hideSuccessModal();
  }
});
