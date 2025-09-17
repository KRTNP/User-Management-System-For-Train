/**
 * Authentication and Role-Based Access Control
 * Handles login, registration, and proper RBAC routing
 */

// Check authentication and redirect appropriately
document.addEventListener('DOMContentLoaded', function() {
  const currentPath = window.location.pathname;
  const currentPage = getCurrentPage(currentPath);

  // Handle authentication routing
  handleAuthenticationRouting(currentPage);

  // Attach event listeners for forms
  attachFormListeners();
});

/**
 * Get current page identifier
 */
function getCurrentPage(path) {
  if (path.includes('login.html')) return 'login';
  if (path.includes('register.html')) return 'register';
  if (path.includes('admin-dashboard.html')) return 'admin-dashboard';
  if (path.includes('dashboard.html')) return 'user-dashboard';
  if (path === '/' || path.includes('index.html')) return 'home';
  return 'unknown';
}

/**
 * Handle authentication routing based on current page and token
 */
function handleAuthenticationRouting(currentPage) {
  const token = localStorage.getItem('token');

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = payload.user;

      // Check if token is expired
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        localStorage.removeItem('token');
        redirectToLogin();
        return;
      }

      if (user && user.role) {
        // Handle routing based on current page and user role
        switch (currentPage) {
          case 'home':
          case 'login':
          case 'register':
            // Already logged in, redirect to appropriate dashboard
            console.log('Auth routing: redirecting logged-in user from', currentPage, 'with role', user.role);
            redirectToDashboard(user.role);
            break;

          case 'admin-dashboard':
            // Admin dashboard access control
            if (user.role !== 'admin') {
              showAlert('Access denied. Admin privileges required.', 'error');
              redirectToDashboard(user.role);
            }
            break;

          case 'user-dashboard':
            // User dashboard is accessible to all authenticated users
            console.log('Auth routing: user on dashboard page, access granted');
            break;

          default:
            // Unknown page, redirect to appropriate dashboard
            redirectToDashboard(user.role);
        }
      } else {
        // Invalid user data in token
        localStorage.removeItem('token');
        redirectToLogin();
      }
    } catch (error) {
      // Invalid token format
      console.error('Invalid token:', error);
      localStorage.removeItem('token');
      redirectToLogin();
    }
  } else {
    // No token - check if on protected page
    if (currentPage === 'admin-dashboard' || currentPage === 'user-dashboard') {
      redirectToLogin();
    }
  }
}

/**
 * Redirect to appropriate dashboard based on role
 */
function redirectToDashboard(role) {
  console.log('redirectToDashboard called with role:', role);
  if (role === 'admin') {
    console.log('Redirecting to admin-dashboard.html');
    window.location.href = 'admin-dashboard.html';
  } else {
    console.log('Redirecting to dashboard.html');
    window.location.href = 'dashboard.html';
  }
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
  window.location.href = 'login.html';
}

/**
 * Attach form event listeners
 */
function attachFormListeners() {
  const registerBtn = document.getElementById('registerUser');
  const loginBtn = document.getElementById('loginUser');

  if (registerBtn) {
    registerBtn.addEventListener('click', registerUser);
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', loginUser);
  }
}

// Show custom alert box
function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;
  
  alertBox.textContent = message;
  alertBox.className =
    'max-w-xs mx-auto mt-4 mb-2 px-4 py-3 rounded relative text-white text-sm ' +
    (type === 'success' ? 'bg-green-500' : 'bg-red-500');
  alertBox.classList.remove('hidden');
  
  setTimeout(() => {
    alertBox.classList.add('hidden');
  }, 3000);
}

// Form validation
function validateForm(username, email, password) {
  if (!username || !email || !password) {
    showAlert('Please fill in all fields.');
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAlert('Please enter a valid email address.');
    return false;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters long.');
    return false;
  }

  return true;
}

// Register user
function registerUser() {
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!validateForm(username, email, password)) return;

  const submitButton = document.getElementById('registerUser');
  submitButton.disabled = true;
  submitButton.textContent = 'Registering...';

  fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP error: ${res.status}`);
      return data;
    })
    .then((data) => {
      // Store token
      localStorage.setItem('token', data.token);
      
      showAlert('Registered successfully!', 'success');
      
      // Clear form
      document.getElementById('username').value = '';
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
      
      // Redirect to dashboard after delay
      setTimeout(() => {
        // Regular users go to the user dashboard
        window.location.href = 'dashboard.html';
      }, 1000);
    })
    .catch((err) => {
      console.error('Registration error:', err);
      showAlert(err.message || 'Registration failed. Try again.');
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.textContent = 'Register';
    });
}

// Login user
function loginUser() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!username || !password) {
    showAlert('Please fill in all fields.');
    return;
  }

  const loginButton = document.getElementById('loginUser');
  loginButton.disabled = true;
  loginButton.textContent = 'Logging in...';

  console.log('Attempting login for:', username);
  
  fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(async (res) => {
      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        throw new Error('Invalid server response format');
      }
      
      if (!res.ok) {
        console.error('Login response not OK:', res.status, data);
        throw new Error(data.message || `HTTP error: ${res.status}`);
      }
      return data;
    })
    .then((data) => {
      // Store token
      localStorage.setItem('token', data.token);

      // Show success message and redirect immediately
      showAlert('Login successful! Redirecting...', 'success');

      // Redirect immediately to appropriate dashboard based on user role
      console.log('Redirecting user with role:', data.user?.role);
      if (data.user && data.user.role === 'admin') {
        console.log('Redirecting to admin dashboard');
        window.location.href = 'admin-dashboard.html';
      } else {
        console.log('Redirecting to user dashboard');
        window.location.href = 'dashboard.html';
      }
    })
    .catch((err) => {
      console.error('Login error:', err);
      showAlert(err.message || 'Login failed. Check your credentials.');
    })
    .finally(() => {
      loginButton.disabled = false;
      loginButton.textContent = 'Login';
    });
}
