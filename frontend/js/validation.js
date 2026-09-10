/**
 * Digital Visitor Management System for College
 * Client-Side Form Validation Module
 */

const FormValidator = {
  // Validate standard single text field
  validateRequired(val) {
    return val !== null && val !== undefined && val.trim().length > 0;
  },

  // Validate Full Name (letters, spaces, dots, min 3 chars)
  validateName(name) {
    if (!name) return false;
    const trimmed = name.trim();
    const regex = /^[a-zA-Z\s.]{3,60}$/;
    return regex.test(trimmed);
  },

  // Validate Contact Phone Number (10 digits)
  validatePhone(phone) {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const regex = /^[6-9]\d{9}$/; // Standard 10 digit mobile starting with 6-9
    return regex.test(cleanPhone) || /^\d{10}$/.test(cleanPhone);
  },

  // Validate Email (optional or valid format)
  validateEmail(email) {
    if (!email || email.trim() === '') return true; // Optional
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  },

  // Mark field as invalid with message
  showError(inputElement, message) {
    if (!inputElement) return;
    inputElement.classList.add('is-invalid');
    let feedback = inputElement.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      inputElement.parentElement.appendChild(feedback);
    }
    feedback.textContent = message;
    feedback.style.display = 'block';
  },

  // Clear field error
  clearError(inputElement) {
    if (!inputElement) return;
    inputElement.classList.remove('is-invalid');
    const feedback = inputElement.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.style.display = 'none';
    }
  },

  // Clear all errors in a form
  clearFormErrors(form) {
    if (!form) return;
    form.querySelectorAll('.form-control').forEach(input => {
      this.clearError(input);
    });
  },

  // Validate full visitor registration form
  validateVisitorRegistration(formData) {
    const errors = {};

    // 1. Visitor Name
    if (!this.validateRequired(formData.name)) {
      errors.name = 'Visitor Full Name is required.';
    } else if (!this.validateName(formData.name)) {
      errors.name = 'Please enter a valid name (minimum 3 alphabetic characters).';
    }

    // 2. Contact Phone
    if (!this.validateRequired(formData.phone)) {
      errors.phone = 'Contact number is required.';
    } else if (!this.validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    // 3. Email (optional format check)
    if (formData.email && !this.validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address.';
    }

    // 4. Purpose of Visit
    if (!this.validateRequired(formData.purpose)) {
      errors.purpose = 'Please specify or select the purpose of visit.';
    }

    // 5. Department to Meet
    if (!this.validateRequired(formData.department)) {
      errors.department = 'Please select the department/faculty to visit.';
    }

    // 6. Host / Person to Meet
    if (!this.validateRequired(formData.hostName)) {
      errors.hostName = 'Please enter the name of the host or staff member to meet.';
    }

    // 7. Date
    if (!this.validateRequired(formData.date)) {
      errors.date = 'Visit date is required.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};
