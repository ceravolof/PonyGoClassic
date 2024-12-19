class DBMock {
    constructor() {
        // In-memory "database"
        this.users = [
            { id: 1, email: 'admin@example.com', username: 'admin', password: '123456', type: 'admin' },
            { id: 2, email: 'user@example.com', username: 'user', password: 'abcdef', type: 'user' },
        ];
        this.nextId = this.users.length ? this.users[this.users.length - 1].id + 1 : 1; // ID generator
    }

    // Get all users (excluding passwords)
    getAllUsers() {
        return this.users.map(({ password, ...user }) => user);
    }

    // Get a user by ID
    getUserById(id) {
        const user = this.users.find(user => user.id === id);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return null;
    }

    // Get a user by email
    getUserByEmail(email) {
        return this.users.find(user => user.email === email);
    }

    // Create a new user
    createUser({ email, username, password, type }) {
        if (!email || !username || !password || !type) {
            throw new Error('All fields are required: email, username, password, type');
        }
        if (this.users.find(user => user.email === email)) {
            throw new Error('Email already exists');
        }
        const newUser = {
            id: this.nextId++,
            email,
            username,
            password,
            type,
        };
        this.users.push(newUser);
        return newUser;
    }

    // Update an existing user
    updateUser(id, updates) {
        const user = this.users.find(user => user.id === id);
        if (!user) {
            return null;
        }
        if (updates.email) {
            if (this.users.find(u => u.email === updates.email && u.id !== id)) {
                throw new Error('Email already exists');
            }
            user.email = updates.email;
        }
        if (updates.username) user.username = updates.username;
        if (updates.password) user.password = updates.password;
        if (updates.type) user.type = updates.type;
        return user;
    }

    // Delete a user
    deleteUser(id) {
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex === -1) {
            return false;
        }
        this.users.splice(userIndex, 1);
        return true;
    }
}

module.exports = DBMock;
