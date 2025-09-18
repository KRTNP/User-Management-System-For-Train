/**
 * User Dashboard JavaScript
 * Handles user profile management and dashboard data display
 */

let currentUser = null;

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkUserAuthentication();

    // Load dashboard data
    loadDashboardData();

    // Attach event listeners
    attachEventListeners();
});

/**
 * Check if user is authenticated
 */
function checkUserAuthentication() {
    const token = localStorage.getItem('token');
    console.log('Dashboard auth check - token exists:', !!token);

    if (!token) {
        console.log('Dashboard auth check - no token, redirecting to login');
        redirectToLogin();
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Dashboard auth check - decoded payload:', payload);
        currentUser = payload.user;
        console.log('Dashboard auth check - currentUser:', currentUser);

        if (!currentUser) {
            console.log('Dashboard auth check - no user data, redirecting to login');
            redirectToLogin();
            return;
        }

        // Update username in header and welcome message
        document.getElementById('username').textContent = currentUser.username;
        document.getElementById('welcomeMessage').textContent = `Welcome back, ${currentUser.username}!`;

        // Load user profile data
        loadUserProfile();

    } catch (error) {
        console.error('Dashboard auth check - Token validation error:', error);
        console.log('Dashboard auth check - Token that failed:', token);
        redirectToLogin();
    }
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
    try {
        await Promise.all([
            loadSystemStatistics(),
            loadRecentActivity()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Error loading dashboard data', 'error');
    }
}

/**
 * Load user profile information
 */
async function loadUserProfile() {
    try {
        const response = await fetchWithAuth('/api/auth/me');
        const data = await response.json();

        if (response.ok) {
            populateProfile(data.user);
        } else {
            throw new Error(data.message || 'Failed to load profile');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Error loading profile: ' + error.message, 'error');
    }
}

/**
 * Populate profile section
 */
function populateProfile(user) {
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileEmail').textContent = user.email;

    // Set role badge
    const roleElement = document.getElementById('profileRole');
    roleElement.textContent = user.role;
    roleElement.className = user.role === 'admin'
        ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
        : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800';

    // Format creation date
    const createdDate = new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('profileCreated').textContent = createdDate;
}

/**
 * Load system statistics
 */
async function loadSystemStatistics() {
    try {
        const response = await fetchWithAuth('/api/dashboard');
        const data = await response.json();

        if (response.ok) {
            document.getElementById('totalUsers').textContent = data.stats.totalUsers || data.stats.users || 0;
            document.getElementById('activeUsers').textContent = data.stats.activeUsers || 0;
            document.getElementById('newUsers').textContent = data.stats.newUsersToday || data.stats.newUsers || 0;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

/**
 * Load recent activity
 */
async function loadRecentActivity() {
    try {
        const response = await fetchWithAuth('/api/dashboard');
        const data = await response.json();

        if (response.ok && data.recentActivity) {
            populateRecentActivity(data.recentActivity);
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

/**
 * Populate recent activity
 */
function populateRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    container.innerHTML = '';

    activities.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';

        const timeAgo = getTimeAgo(new Date(activity.timestamp));

        item.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <i class="fas fa-clock text-gray-400"></i>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-gray-900">${activity.action}</p>
                    <p class="text-xs text-gray-500">${activity.description || ''}</p>
                </div>
            </div>
            <div class="text-xs text-gray-500">${timeAgo}</div>
        `;

        container.appendChild(item);
    });
}

/**
 * Get time ago string
 */
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
        return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
    } else {
        return `${diffDays} days ago`;
    }
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Edit profile button
    document.getElementById('editProfileBtn').addEventListener('click', openEditProfileModal);

    // Edit profile modal buttons
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditProfileModal);
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

    // Quick action buttons
    const quickActionButtons = document.querySelectorAll('.grid button');
    quickActionButtons.forEach((button, index) => {
        button.addEventListener('click', () => handleQuickAction(index));
    });
}

/**
 * Open edit profile modal
 */
function openEditProfileModal() {
    // Pre-fill form with current data
    document.getElementById('editUsername').value = currentUser.username;
    document.getElementById('editEmail').value = document.getElementById('profileEmail').textContent;

    // Show modal
    document.getElementById('editProfileModal').classList.remove('hidden');
}

/**
 * Close edit profile modal
 */
function closeEditProfileModal() {
    document.getElementById('editProfileModal').classList.add('hidden');
    document.getElementById('editProfileForm').reset();
}

/**
 * Save profile changes
 */
async function saveProfile() {
    const form = document.getElementById('editProfileForm');
    const formData = new FormData(form);

    const profileData = {
        username: formData.get('username'),
        email: formData.get('email')
    };

    // Basic validation
    if (!profileData.username || !profileData.email) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    try {
        const response = await fetchWithAuth(`/api/auth/me`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('Profile updated successfully', 'success');
            closeEditProfileModal();

            // Refresh profile data
            await loadUserProfile();

            // Update current user data
            currentUser.username = profileData.username;
            document.getElementById('username').textContent = currentUser.username;
            document.getElementById('welcomeMessage').textContent = `Welcome back, ${currentUser.username}!`;
        } else {
            throw new Error(result.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Error updating profile: ' + error.message, 'error');
    }
}

/**
 * Handle quick action button clicks
 */
function handleQuickAction(actionIndex) {
    switch(actionIndex) {
        case 0: // Update Profile
            openEditProfileModal();
            break;
        case 1: // Change Password
            showAlert('Password change functionality coming soon', 'info');
            break;
        case 2: // Notifications
            showAlert('Notifications feature coming soon', 'info');
            break;
        case 3: // Help & Support
            showAlert('Help & Support feature coming soon', 'info');
            break;
        default:
            console.log('Unknown action');
    }
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

/**
 * Show alert message
 */
function showAlert(message, type = 'error') {
    const alertBox = document.getElementById('alertBox');
    alertBox.textContent = message;

    let bgColor = 'bg-red-500';
    if (type === 'success') bgColor = 'bg-green-500';
    if (type === 'info') bgColor = 'bg-blue-500';

    alertBox.className = `mb-6 px-4 py-3 rounded relative text-white text-sm ${bgColor}`;
    alertBox.classList.remove('hidden');

    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 5000);
}

/**
 * Fetch with authentication
 */
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');

    if (!token) {
        redirectToLogin();
        throw new Error('No authentication token');
    }

    const defaultOptions = {
        headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    const response = await fetch(`http://localhost:3000${url}`, mergedOptions);

    // Handle unauthorized responses
    if (response.status === 401) {
        localStorage.removeItem('token');
        redirectToLogin();
        throw new Error('Session expired');
    }

    return response;
}