/**
 * Profile Page Module
 * Renders user profile and account settings with modern card-based layout
 */

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
        <a href="#/profile/security" class="btn btn-secondary">Security Settings</a>
        <a href="#/profile/preferences" class="btn btn-secondary">Preferences</a>
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
          <div class="info-row">
            <span class="info-label">City</span>
            <span class="info-value">${escapeHtml(user?.city || '-')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Province</span>
            <span class="info-value">${escapeHtml(user?.province || '-')}</span>
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
          <a href="#/profile/security" class="btn btn-secondary" style="justify-content: flex-start;">
            Security Settings
          </a>
        </div>
      </div>

      <div class="profile-section">
        <div class="profile-section-title">
          <h3>Preferences & Notifications</h3>
        </div>
        <p class="text-muted" style="margin: 0 0 1rem 0;">Manage how you interact with Bater and receive notifications.</p>
        <div style="display: grid; gap: 0.75rem;">
          <a href="#/profile/notifications" class="btn btn-secondary" style="justify-content: flex-start;">
            Notification Settings
          </a>
          <a href="#/profile/preferences" class="btn btn-secondary" style="justify-content: flex-start;">
            Account Preferences
          </a>
        </div>
      </div>

      <div class="profile-section">
        <div class="profile-section-title">
          <h3>Account Status</h3>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value">
            ${user?.is_active === false ? '<span class="status-badge status-inactive">Inactive</span>' : '<span class="status-badge status-active">Active</span>'}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Account Type</span>
          <span class="info-value"><span class="status-badge">${escapeHtml(user?.role || 'User')}</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">Account Created</span>
          <span class="info-value">${formatDate(user?.created_at || user?.createdAt)}</span>
        </div>
      </div>
    </div>
  `;
}

export function initProfilePage() {
  const pictureInput = document.getElementById('picture-input');
  const profilePic = document.getElementById('profile-pic');
  const uploadFeedback = document.getElementById('upload-feedback');

  if (pictureInput) {
    pictureInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      uploadFeedback.textContent = 'Uploading...';
      uploadFeedback.className = 'form-help';

      try {
        const formData = new FormData();
        formData.append('profile_picture', file);

        const response = await userService.uploadProfilePicture(formData);
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
}
