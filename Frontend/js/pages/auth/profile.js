

import { userService } from '../../services/userService.js';
import { auth } from '../../utils/auth.js';
import { assetUrl } from '../../utils/assets.js';
import { showNotification } from '../../components/notifications.js';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getInitials(name) {
  return String(name || 'U')
    .split(' ')
    .slice(0, 2)
    .map(n => n.charAt(0).toUpperCase())
    .join('');
}

async function currentProfile() {
  try {
    const response = await userService.getProfile();
    if (response.success) {
      const user = { ...auth.getUser(), ...response.data };
      auth.setUser(user);
      return user;
    }
  } catch {
    return auth.getUser();
  }

  return auth.getUser();
}

export async function profilePage() {
  const user = await currentProfile();
  const hash = window.location.hash;
  
  // Route to different views based on hash
  if (hash.includes('profile/edit')) {
    return editProfilePage(user);
  }
  if (hash.includes('profile/change-password')) {
    return changePasswordPage();
  }
  
  // Default: show main profile view
  return mainProfilePage(user);
}

function editProfilePage(user) {
  return `
    <div class="profile-container">
      <div class="form-header" style="margin-bottom: 2rem;">
        <h1>Edit Profile</h1>
        <p>Update your personal information</p>
      </div>
      
      <form id="edit-profile-form" class="form-card">
        <div class="form-group">
          <label for="name" class="form-label">Full Name *</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            required 
            value="${escapeHtml(user?.name || '')}"
            class="form-control"
            placeholder="Enter your full name"
          >
          <span class="error-message" id="name-error"></span>
        </div>
        
        <div class="form-group">
          <label for="email" class="form-label">Email Address *</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            required 
            value="${escapeHtml(user?.email || '')}"
            class="form-control"
            placeholder="your@email.com"
          >
          <span class="error-message" id="email-error"></span>
        </div>
        
        <div class="form-group">
          <label for="phone" class="form-label">Phone Number</label>
          <input 
            type="tel" 
            id="phone" 
            name="phone" 
            value="${escapeHtml(user?.phone || '')}"
            class="form-control"
            placeholder="(+27) 123-456-7890"
          >
          <span class="error-message" id="phone-error"></span>
        </div>
        
        <div class="form-group">
          <label for="address" class="form-label">Street Address</label>
          <input 
            type="text" 
            id="address" 
            name="address" 
            value="${escapeHtml(user?.address || '')}"
            class="form-control"
            placeholder="123 Main Street"
          >
        </div>
        
        <div class="form-group">
          <label for="city" class="form-label">City</label>
          <input 
            type="text" 
            id="city" 
            name="city" 
            value="${escapeHtml(user?.city || '')}"
            class="form-control"
            placeholder="Johannesburg"
          >
        </div>
        
        <div class="form-group">
          <label for="province" class="form-label">Province</label>
          <input 
            type="text" 
            id="province" 
            name="province" 
            value="${escapeHtml(user?.province || '')}"
            class="form-control"
            placeholder="Gauteng"
          >
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem;">
          <button type="submit" class="btn btn-primary">
            <span class="btn-text">Save Changes</span>
            <span class="spinner hidden"></span>
          </button>
          <a href="#/profile" class="btn btn-secondary">Cancel</a>
        </div>
      </form>
    </div>
  `;
}

function changePasswordPage() {
  return `
    <div class="profile-container">
      <div class="form-header" style="margin-bottom: 2rem;">
        <h1>Change Password</h1>
        <p>Update your password to keep your account secure</p>
      </div>
      
      <form id="change-password-form" class="form-card">
        <div class="form-group">
          <label for="current-password" class="form-label">Current Password *</label>
          <input 
            type="password" 
            id="current-password" 
            name="current_password" 
            required 
            class="form-control"
            placeholder="Enter your current password"
          >
          <span class="error-message" id="current_password-error"></span>
        </div>
        
        <div class="form-group">
          <label for="new-password" class="form-label">New Password *</label>
          <input 
            type="password" 
            id="new-password" 
            name="new_password" 
            required 
            class="form-control"
            placeholder="Enter your new password"
            minlength="8"
          >
          <span class="form-hint">Password must be at least 8 characters</span>
          <span class="error-message" id="new_password-error"></span>
        </div>
        
        <div class="form-group">
          <label for="confirm-password" class="form-label">Confirm Password *</label>
          <input 
            type="password" 
            id="confirm-password" 
            name="confirm_password" 
            required 
            class="form-control"
            placeholder="Re-enter your new password"
            minlength="8"
          >
          <span class="error-message" id="confirm_password-error"></span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem;">
          <button type="submit" class="btn btn-primary">
            <span class="btn-text">Update Password</span>
            <span class="spinner hidden"></span>
          </button>
          <a href="#/profile" class="btn btn-secondary">Cancel</a>
        </div>
      </form>
    </div>
  `;
}

function mainProfilePage(user) {
  const initials = getInitials(user?.name);
  const hasPhoto = user?.profile_picture && user?.profile_picture !== 'null';

  return `
    <div class="profile-container">
      <div class="profile-header-card">
        <div class="profile-avatar-panel">
          ${hasPhoto
            ? `<img id="profile-pic" src="${escapeHtml(assetUrl(user?.profile_picture))}" alt="Profile picture" class="avatar-large" onerror="this.onerror=null;this.src='images/Images.png';">`
            : `<div class="avatar-large avatar-placeholder">${escapeHtml(initials)}</div>`
          }
          <label for="picture-input" class="btn btn-secondary btn-sm">Change Photo</label>
          <input type="file" id="picture-input" accept="image/png,image/jpeg" class="hidden">
          <p id="upload-feedback" class="form-help" aria-live="polite"></p>
        </div>

        <div class="profile-heading">
          <div class="flex-between">
            <div>
              <span class="status-badge status-active">
                Role: ${escapeHtml(user?.role || 'User')}
              </span>
            </div>
          </div>
          <h1 class="m-sm">${escapeHtml(user?.name || 'User Account')}</h1>
          <p class="text-muted m-0">${escapeHtml(user?.email || 'No email')}</p>

          <div class="profile-meta">
            <span>Joined ${formatDate(user?.created_at || user?.createdAt)}</span>
            <span>|</span>
            <span>${user?.is_active === false ? 'Inactive' : 'Active'}</span>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <a href="#/profile/edit" class="btn btn-primary">Edit Profile</a>
      </div>

      <div class="card-row-2">
        <div class="profile-section">
          <div class="profile-section-title">
            <h3>Personal Information</h3>
            <a href="#/profile/edit" class="btn btn-primary btn-sm">Edit</a>
          </div>
          <div class="info-row">
            <span class="info-label">Full Name</span>
            <span class="info-value">${escapeHtml(user?.name || '-')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email Address</span>
            <span class="info-value">${escapeHtml(user?.email || '-')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone Number</span>
            <span class="info-value">${escapeHtml(user?.phone || '-')}</span>
          </div>
        </div>

        <div class="profile-section">
          <div class="profile-section-title">
            <h3>Address Information</h3>
            <a href="#/profile/edit" class="btn btn-primary btn-sm">Edit</a>
          </div>
          <div class="info-row">
            <span class="info-label">Street Address</span>
            <span class="info-value">${escapeHtml(user?.address || '-')}</span>
          </div>
         
        </div>
      </div>

      <div class="profile-section">
        <div class="profile-section-title">
          <h3>Security & Password</h3>
        </div>
        <p class="text-muted" style="margin: 0 0 1rem 0;">Keep your account secure with strong passwords and security settings.</p>
        <div style="display: grid; gap: 0.75rem;">
          <a href="#/profile/change-password" class="btn btn-secondary" style="justify-content: flex-start;">
            Change Password
          </a>
        </div>
      </div>

      <div class="profile-section">
        <div class="profile-section-title">
          <h3>Account Settings</h3>
        </div>
        <p class="text-muted" style="margin: 0 0 1rem 0;">Manage your account status and security.</p>
        <div style="display: grid; gap: 0.75rem;">
          <button id="deactivate-account-btn" class="btn btn-danger" style="justify-content: flex-start;">
            Deactivate Account
          </button>
        </div>
      </div>
    </div>
  `;
}

export function initProfilePage() {
  const hash = window.location.hash;
  
  // Handle edit profile form
  if (hash.includes('profile/edit')) {
    initEditProfileForm();
    return;
  }
  
  // Handle change password form
  if (hash.includes('profile/change-password')) {
    initChangePasswordForm();
    return;
  }
  
  // Handle main profile page
  initMainProfilePage();
}

function initMainProfilePage() {
  const pictureInput = document.getElementById('picture-input');
  const profilePic = document.getElementById('profile-pic');
  const uploadFeedback = document.getElementById('upload-feedback');
  const deactivateBtn = document.getElementById('deactivate-account-btn');

  if (pictureInput) {
    pictureInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      uploadFeedback.textContent = 'Uploading...';
      uploadFeedback.className = 'form-help';

      try {
        const response = await userService.uploadProfilePicture(file);
        if (response.success) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (profilePic) {
              profilePic.src = event.target?.result;
              profilePic.style.display = 'block';
            }
          };
          reader.readAsDataURL(file);

          uploadFeedback.textContent = 'Photo updated successfully!';
          uploadFeedback.className = 'form-help success';
          showNotification('Profile photo updated!', 'success');
        } else {
          uploadFeedback.textContent = response.error || 'Upload failed';
          uploadFeedback.className = 'form-help error';
          showNotification(response.error || 'Failed to upload photo', 'error');
        }
      } catch (error) {
        uploadFeedback.textContent = 'Error uploading photo. Try again.';
        uploadFeedback.className = 'form-help error';
        showNotification('Error uploading photo', 'error');
      }
    });

    const changePhotoBtn = document.querySelector('label[for="picture-input"]');
    if (changePhotoBtn) {
      changePhotoBtn.addEventListener('click', () => {
        pictureInput.click();
      });
    }
  }
  
  // Handle deactivate account button
  if (deactivateBtn) {
    deactivateBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to deactivate your account? This action cannot be undone immediately. You will have 30 days to reactivate it.')) {
        try {
          const response = await userService.deactivateAccount();
          if (response.success) {
            showNotification('Account deactivated. You will be logged out.', 'success');
            setTimeout(() => {
              auth.logout();
              window.location.hash = '#/login';
            }, 1500);
          } else {
            showNotification(response.error || 'Failed to deactivate account', 'error');
          }
        } catch (error) {
          showNotification(error.message || 'Failed to deactivate account', 'error');
        }
      }
    });
  }
}

function initEditProfileForm() {
  const form = document.getElementById('edit-profile-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = form.querySelector('.btn-text');
    const spinner = form.querySelector('.spinner');
    
    try {
      submitBtn.disabled = true;
      spinner.classList.remove('hidden');
      btnText.textContent = 'Saving...';
      
     const data = Object.fromEntries(new FormData(form).entries());
    const response = await userService.updateProfile(data);
      console.log('update response:', response);
      if (response.success) {
        // Update local auth user data
        const user = await currentProfile();
        auth.setUser(user);
        showNotification('Profile updated successfully!', 'success');
        setTimeout(() => {
          window.location.hash = '#/profile';
        }, 1000);
      } else {
        showNotification(response.error || 'Failed to update profile', 'error');
        submitBtn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = 'Save Changes';
      }
    } catch (error) {
      showNotification(error.message || 'Failed to update profile', 'error');
      submitBtn.disabled = false;
      spinner.classList.add('hidden');
      btnText.textContent = 'Save Changes';
    }
  });
}

function initChangePasswordForm() {
  const form = document.getElementById('change-password-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    const newPass = form.querySelector('#new-password').value;
    const confirmPass = form.querySelector('#confirm-password').value;
    
    // Validate passwords match
    if (newPass !== confirmPass) {
      form.querySelector('#confirm_password-error').textContent = 'Passwords do not match';
      return;
    }
    
    // Validate minimum length
    if (newPass.length < 8) {
      form.querySelector('#new_password-error').textContent = 'Password must be at least 8 characters';
      return;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = form.querySelector('.btn-text');
    const spinner = form.querySelector('.spinner');
    
    try {
      submitBtn.disabled = true;
      spinner.classList.remove('hidden');
      btnText.textContent = 'Updating...';
      
      const response = await userService.changePassword({
        current_password: form.querySelector('#current-password').value,
        new_password: newPass
      });
      
      if (response.success) {
        showNotification('Password changed successfully!', 'success');
        setTimeout(() => {
          window.location.hash = '#/profile';
        }, 1000);
      } else {
        showNotification(response.error || 'Failed to change password', 'error');
        form.querySelector('#current_password-error').textContent = response.error || 'Failed to change password';
        submitBtn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = 'Update Password';
      }
    } catch (error) {
      showNotification(error.message || 'Failed to change password', 'error');
      submitBtn.disabled = false;
      spinner.classList.add('hidden');
      btnText.textContent = 'Update Password';
    }
  });
}
