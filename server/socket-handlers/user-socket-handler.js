const { R } = require("redbean-node");
const { log } = require("../../src/util");
const { checkLogin, doubleCheckPassword } = require("../util-server");
const passwordHash = require("../password-hash");
const User = require("../model/user");

/**
 * Handler for user management socket events
 * @param {Socket} socket Socket.io instance
 * @returns {void}
 */
module.exports.userSocketHandler = (socket) => {
    
    /**
     * Get list of all users
     */
    socket.on("getUsers", async (callback) => {
        try {
            checkLogin(socket);
            
            // Only the first user (admin) can manage users
            const currentUser = await R.findOne("user", " id = ? ", [socket.userID]);
            if (!currentUser || currentUser.id !== 1) {
                throw new Error("Only the admin can manage users");
            }
            
            const users = await R.findAll("user", " ORDER BY id ");
            
            // Don't send passwords
            const sanitizedUsers = users.map(user => {
                return {
                    id: user.id,
                    username: user.username,
                    active: user.active,
                    isAdmin: user.id === 1
                };
            });
            
            callback({
                ok: true,
                users: sanitizedUsers
            });
            
        } catch (e) {
            callback({
                ok: false,
                msg: e.message
            });
        }
    });
    
    /**
     * Add a new user
     */
    socket.on("addUser", async (username, password, callback) => {
        try {
            checkLogin(socket);
            
            // Only the first user (admin) can add users
            const currentUser = await R.findOne("user", " id = ? ", [socket.userID]);
            if (!currentUser || currentUser.id !== 1) {
                throw new Error("Only the admin can add users");
            }
            
            // Check if username already exists
            const existingUser = await R.findOne("user", " username = ? ", [username]);
            if (existingUser) {
                throw new Error("Username already exists");
            }
            
            // Validate password strength
            if (password.length < 8) {
                throw new Error("Password must be at least 8 characters long");
            }
            
            // Create new user
            const user = R.dispense("user");
            user.username = username;
            user.password = passwordHash.generate(password);
            user.active = true;
            
            await R.store(user);
            
            callback({
                ok: true,
                msg: "User added successfully"
            });
            
        } catch (e) {
            callback({
                ok: false,
                msg: e.message
            });
        }
    });
    
    /**
     * Delete a user
     */
    socket.on("deleteUser", async (userID, callback) => {
        try {
            checkLogin(socket);
            
            // Only the first user (admin) can delete users
            const currentUser = await R.findOne("user", " id = ? ", [socket.userID]);
            if (!currentUser || currentUser.id !== 1) {
                throw new Error("Only the admin can delete users");
            }
            
            // Cannot delete the admin user
            if (parseInt(userID) === 1) {
                throw new Error("Cannot delete the admin user");
            }
            
            // Check if user exists
            const user = await R.findOne("user", " id = ? ", [userID]);
            if (!user) {
                throw new Error("User not found");
            }
            
            // Delete user
            await R.trash(user);
            
            callback({
                ok: true,
                msg: "User deleted successfully"
            });
            
        } catch (e) {
            callback({
                ok: false,
                msg: e.message
            });
        }
    });
    
    /**
     * Change user password
     */
    socket.on("changeUserPassword", async (userID, newPassword, callback) => {
        try {
            checkLogin(socket);
            
            // Admin can change any user's password
            // Regular users can only change their own password
            const currentUser = await R.findOne("user", " id = ? ", [socket.userID]);
            if (!currentUser) {
                throw new Error("Current user not found");
            }
            
            if (currentUser.id !== 1 && currentUser.id !== parseInt(userID)) {
                throw new Error("You can only change your own password");
            }
            
            // Validate password strength
            if (newPassword.length < 8) {
                throw new Error("Password must be at least 8 characters long");
            }
            
            // Check if user exists
            const user = await R.findOne("user", " id = ? ", [userID]);
            if (!user) {
                throw new Error("User not found");
            }
            
            // Update password
            await User.resetPassword(user.id, newPassword);
            
            callback({
                ok: true,
                msg: "Password changed successfully"
            });
            
        } catch (e) {
            callback({
                ok: false,
                msg: e.message
            });
        }
    });
    
    /**
     * Toggle user active status
     */
    socket.on("toggleUserActive", async (userID, callback) => {
        try {
            checkLogin(socket);
            
            // Only the first user (admin) can toggle user status
            const currentUser = await R.findOne("user", " id = ? ", [socket.userID]);
            if (!currentUser || currentUser.id !== 1) {
                throw new Error("Only the admin can change user status");
            }
            
            // Cannot deactivate the admin user
            if (parseInt(userID) === 1) {
                throw new Error("Cannot deactivate the admin user");
            }
            
            // Check if user exists
            const user = await R.findOne("user", " id = ? ", [userID]);
            if (!user) {
                throw new Error("User not found");
            }
            
            // Toggle active status
            user.active = !user.active;
            await R.store(user);
            
            callback({
                ok: true,
                msg: user.active ? "User activated" : "User deactivated"
            });
            
        } catch (e) {
            callback({
                ok: false,
                msg: e.message
            });
        }
    });
}; 