/**
 * Admin Dashboard JavaScript
 * Handles user management operations with full CRUD functionality
 */

let currentUser = null;
let editingUserId = null;

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and role
    checkAdminAuthentication();

    // Load dashboard data
    loadDashboardData();

    // Attach event listeners
    attachEventListeners();
});

/**
 * Check if user is authenticated and has admin role
 */
function checkAdminAuthentication() {
    const token = localStorage.getItem('token');

    if (!token) {
        redirectToLogin();
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUser = payload.user;

        if (!currentUser || currentUser.role !== 'admin') {
            showAlert('Access denied. Admin privileges required.', 'error');
            redirectToLogin();
            return;
        }

        // Update admin username in header
        document.getElementById('adminUsername').textContent = currentUser.username;

    } catch (error) {
        console.error('Token validation error:', error);
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
            loadStatistics(),
            loadUsers(),
            loadRecentActivity()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Error loading dashboard data', 'error');
    }
}

/**
 * Load system statistics
 */
async function loadStatistics() {
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
 * Load users list
 */
async function loadUsers() {
    try {
        const response = await fetchWithAuth('/api/users');
        const users = await response.json();

        if (response.ok) {
            populateUsersTable(users);
        } else {
            throw new Error(users.message || 'Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Error loading users: ' + error.message, 'error');
    }
}

/**
 * Populate users table
 */
function populateUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

/**
 * Create user table row
 */
function createUserRow(user) {
    const row = document.createElement('tr');

    // Format creation date
    const createdDate = new Date(user.created_at).toLocaleDateString();

    // Role badge styling
    const roleClass = user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <i class="fas fa-user text-gray-600"></i>
                    </div>
                </div>
                <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${user.username}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${user.email}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleClass}">
                ${user.role}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${createdDate}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button onclick="editUser(${user.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                <i class="fas fa-edit"></i> Edit
            </button>
            ${user.id !== currentUser.id ? `
                <button onclick="deleteUser(${user.id})" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i> Delete
                </button>
            ` : '<span class="text-gray-400">Current User</span>'}
        </td>
    `;

    return row;
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

    // Modal buttons
    document.getElementById('addUserBtn').addEventListener('click', openAddUserModal);
    document.getElementById('cancelBtn').addEventListener('click', closeUserModal);
    document.getElementById('saveUserBtn').addEventListener('click', saveUser);

    // Delete modal buttons
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteUser);
}

/**
 * Open add user modal
 */
function openAddUserModal() {
    editingUserId = null;
    document.getElementById('modalTitle').textContent = 'Add User';
    document.getElementById('userForm').reset();
    document.getElementById('modalUsername').disabled = false;
    document.getElementById('modalPassword').required = true;
    document.getElementById('userModal').classList.remove('hidden');
}

/**
 * Edit user
 */
async function editUser(userId) {
    try {
        const response = await fetchWithAuth(`/api/users/${userId}`);
        const user = await response.json();

        if (response.ok) {
            editingUserId = userId;
            document.getElementById('modalTitle').textContent = 'Edit User';
            document.getElementById('modalUsername').value = user.username;
            document.getElementById('modalEmail').value = user.email;
            document.getElementById('modalRole').value = user.role;
            document.getElementById('modalUsername').disabled = true;
            document.getElementById('modalPassword').required = false;
            document.getElementById('modalPassword').value = '';
            document.getElementById('userModal').classList.remove('hidden');
        } else {
            throw new Error(user.message || 'Failed to load user');
        }
    } catch (error) {
        console.error('Error loading user:', error);
        showAlert('Error loading user: ' + error.message, 'error');
    }
}

/**
 * Save user (create or update)
 */
async function saveUser() {
    const form = document.getElementById('userForm');
    const formData = new FormData(form);

    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        role: formData.get('role')
    };

    // Add password for new users or if provided for existing users
    if (formData.get('password')) {
        userData.password = formData.get('password');
    }

    // Validation
    if (!userData.username || !userData.email || !userData.role) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    if (!editingUserId && !userData.password) {
        showAlert('Password is required for new users', 'error');
        return;
    }

    try {
        let response;

        if (editingUserId) {
            // Update existing user
            response = await fetchWithAuth(`/api/users/${editingUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
        } else {
            // Create new user
            response = await fetchWithAuth('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
        }

        const result = await response.json();

        if (response.ok) {
            showAlert(`User ${editingUserId ? 'updated' : 'created'} successfully`, 'success');
            closeUserModal();
            loadUsers(); // Refresh users list
        } else {
            throw new Error(result.message || 'Failed to save user');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showAlert('Error saving user: ' + error.message, 'error');
    }
}

/**
 * Delete user
 */
function deleteUser(userId) {
    document.getElementById('deleteUserId').value = userId;
    document.getElementById('deleteModal').classList.remove('hidden');
}

/**
 * Confirm delete user
 */
async function confirmDeleteUser() {
    const userId = document.getElementById('deleteUserId').value;

    try {
        const response = await fetchWithAuth(`/api/users/${userId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('User deleted successfully', 'success');
            closeDeleteModal();
            loadUsers(); // Refresh users list
        } else {
            throw new Error(result.message || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Error deleting user: ' + error.message, 'error');
    }
}

/**
 * Close user modal
 */
function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
    document.getElementById('userForm').reset();
    editingUserId = null;
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
    document.getElementById('deleteUserId').value = '';
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
    alertBox.className = `mb-6 px-4 py-3 rounded relative text-white text-sm ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
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
        // headers: {
        //     'x-auth-token': token,
        //     'Content-Type': 'application/json'
        // }
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