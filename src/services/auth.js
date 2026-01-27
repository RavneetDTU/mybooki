const MOCK_USERS = [
    {
        email: 'admin@jarvis.com',
        password: 'Admin@123',
        name: 'Admin User',
        role: 'admin'
    },
    {
        email: 'test@jarvis.com',
        password: 'Test@123',
        name: 'Test User',
        role: 'user'
    }
];

export const authService = {
    login: async (credentials) => {
        // Simulate API network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const user = MOCK_USERS.find(u =>
            u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
            // Return success with a fake token and user data (excluding password)
            const { password, ...userWithoutPassword } = user;
            return {
                success: true,
                token: `mock-jwt-token-${user.role}-${Date.now()}`,
                user: userWithoutPassword
            };
        }

        throw new Error('Invalid email or password');
    },

    signup: async (data) => {
        // Simulate API network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // For now, allow any signup in mock mode, or you could restrict it
        // mimicking a real "create" operation
        return {
            success: true,
            token: `mock-jwt-token-new-user-${Date.now()}`,
            user: { name: data.name, email: data.email, role: 'user' }
        };
    },

    changePassword: async (currentPassword, newPassword) => {
        await new Promise(resolve => setTimeout(resolve, 800));
        // Mock validation
        if (newPassword.length < 8) {
            throw new Error("Password must be at least 8 characters");
        }
        return { success: true, message: "Password updated successfully" };
    },

    // Helper to get current user from token (if needed later)
    getCurrentUser: async () => {
        // Implement real token validation API call here later
        return null;
    }
};
