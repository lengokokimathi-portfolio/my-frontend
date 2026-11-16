const DB_CONFIG = {
    apiUrl: 'https://skillbridge-1-lp5q.onrender.com'  // Your live backend
};

const DB = {
    async checkHealth() {
        try {
            const response = await fetch(`${DB_CONFIG.apiUrl}/api/health`);
            return response.ok;
        } catch {
            console.warn('⚠️ Backend not available');
            return false;
        }
    },

    async register(userData) {
        const validation = this.validateRegistration(userData);
        if (!validation.valid) {
            return { success: false, error: validation.errors.join(', ') };
        }

        try {
            const response = await fetch(`${DB_CONFIG.apiUrl}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    location: userData.location || 'Kenya',
                    password: userData.password,
                    confirmPassword: userData.password2,
                    accountType: this.mapRole(userData.role)
                })
            });

            const result = await response.json();
            return result.success 
                ? { success: true, message: 'Account created successfully', userId: result.userId }
                : { success: false, error: result.error || 'Registration failed' };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Cannot connect to backend server' };
        }
    },

    validateRegistration(data) {
        const errors = [];
        if (!data.name || data.name.length < 2) errors.push('Name required (min 2 characters)');
        if (!data.email) errors.push('Email required');
        if (!data.phone) errors.push('Phone number required');
        if (!data.password || data.password.length < 8) errors.push('Password must be at least 8 characters');
        if (data.password !== data.password2) errors.push('Passwords do not match');
        return { valid: errors.length === 0, errors };
    },

    mapRole(role) {
        const map = {
            'I provide skills': 'provider',
            'I need skills': 'seeker',
            'Both': 'both'
        };
        return map[role] || 'seeker';
    },

    async initiatePayment(paymentData) {
        try {
            const response = await fetch(`${DB_CONFIG.apiUrl}/api/payment/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });

            const result = await response.json();

            if (result.success) {
                return {
                    success: true,
                    message: 'Check your phone to enter PIN'
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Payment initiation failed'
                };
            }
        } catch (error) {
            console.error('Payment error:', error);
            return {
                success: false,
                error: 'Network error - cannot connect to payment service'
            };
        }
    }
};

window.DB = DB;

// Health check on load
DB.checkHealth().then(isHealthy => {
    if (isHealthy) {
        console.log('✅ Backend server is available');
    } else {
        console.warn('⚠️ Backend server not available - registration will fail');
    }
});