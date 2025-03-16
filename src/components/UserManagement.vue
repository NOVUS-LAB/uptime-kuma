<template>
    <div>
        <h2>{{ $t("User Management") }}</h2>
        <p>{{ $t("Manage users who can access Uptime Kuma") }}</p>

        <div class="mb-3">
            <button class="btn btn-primary" @click="showAddUserModal">
                <font-awesome-icon icon="plus" />
                {{ $t("Add User") }}
            </button>
        </div>

        <div v-if="loading" class="text-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">{{ $t("Loading") }}...</span>
            </div>
        </div>

        <div v-else-if="users.length === 0" class="alert alert-info">
            {{ $t("No users found") }}
        </div>

        <div v-else class="table-responsive">
            <table class="table table-bordered table-hover">
                <thead>
                    <tr>
                        <th>{{ $t("ID") }}</th>
                        <th>{{ $t("Username") }}</th>
                        <th>{{ $t("Status") }}</th>
                        <th>{{ $t("Role") }}</th>
                        <th>{{ $t("Actions") }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="user in users" :key="user.id">
                        <td>{{ user.id }}</td>
                        <td>{{ user.username }}</td>
                        <td>
                            <span v-if="user.active" class="badge bg-success">{{ $t("Active") }}</span>
                            <span v-else class="badge bg-danger">{{ $t("Inactive") }}</span>
                        </td>
                        <td>
                            <span v-if="user.isAdmin" class="badge bg-primary">{{ $t("Admin") }}</span>
                            <span v-else class="badge bg-secondary">{{ $t("User") }}</span>
                        </td>
                        <td>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-primary" @click="showChangePasswordModal(user)" :disabled="!canManageUser(user)">
                                    <font-awesome-icon icon="key" />
                                    {{ $t("Change Password") }}
                                </button>
                                <button class="btn btn-sm" :class="user.active ? 'btn-warning' : 'btn-success'" @click="toggleUserActive(user)" :disabled="!canManageUser(user)">
                                    <font-awesome-icon :icon="user.active ? 'ban' : 'check'" />
                                    {{ user.active ? $t("Deactivate") : $t("Activate") }}
                                </button>
                                <button class="btn btn-sm btn-danger" @click="showDeleteUserModal(user)" :disabled="!canManageUser(user)">
                                    <font-awesome-icon icon="trash" />
                                    {{ $t("Delete") }}
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Add User Modal -->
        <div class="modal fade" id="addUserModal" tabindex="-1" aria-labelledby="addUserModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="addUserModalLabel">{{ $t("Add User") }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="username" class="form-label">{{ $t("Username") }}</label>
                            <input type="text" class="form-control" id="username" v-model="newUser.username" required>
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label">{{ $t("Password") }}</label>
                            <input type="password" class="form-control" id="password" v-model="newUser.password" required>
                        </div>
                        <div class="mb-3">
                            <label for="confirmPassword" class="form-label">{{ $t("Confirm Password") }}</label>
                            <input type="password" class="form-control" id="confirmPassword" v-model="newUser.confirmPassword" required>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ $t("Cancel") }}</button>
                        <button type="button" class="btn btn-primary" @click="addUser" :disabled="!canAddUser">{{ $t("Add") }}</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Change Password Modal -->
        <div class="modal fade" id="changePasswordModal" tabindex="-1" aria-labelledby="changePasswordModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="changePasswordModalLabel">{{ $t("Change Password") }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="newPassword" class="form-label">{{ $t("New Password") }}</label>
                            <input type="password" class="form-control" id="newPassword" v-model="passwordChange.newPassword" required>
                        </div>
                        <div class="mb-3">
                            <label for="confirmNewPassword" class="form-label">{{ $t("Confirm New Password") }}</label>
                            <input type="password" class="form-control" id="confirmNewPassword" v-model="passwordChange.confirmNewPassword" required>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ $t("Cancel") }}</button>
                        <button type="button" class="btn btn-primary" @click="changePassword" :disabled="!canChangePassword">{{ $t("Change") }}</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete User Modal -->
        <div class="modal fade" id="deleteUserModal" tabindex="-1" aria-labelledby="deleteUserModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="deleteUserModalLabel">{{ $t("Delete User") }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>{{ $t("Are you sure you want to delete this user?") }}</p>
                        <p><strong>{{ selectedUser ? selectedUser.username : '' }}</strong></p>
                        <p class="text-danger">{{ $t("This action cannot be undone.") }}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ $t("Cancel") }}</button>
                        <button type="button" class="btn btn-danger" @click="deleteUser">{{ $t("Delete") }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { Modal } from "bootstrap";
import { useToast } from "vue-toastification";

export default {
    data() {
        return {
            users: [],
            loading: true,
            selectedUser: null,
            newUser: {
                username: "",
                password: "",
                confirmPassword: ""
            },
            passwordChange: {
                newPassword: "",
                confirmNewPassword: ""
            },
            addUserModal: null,
            changePasswordModal: null,
            deleteUserModal: null
        };
    },
    
    computed: {
        canAddUser() {
            return this.newUser.username && 
                   this.newUser.password && 
                   this.newUser.password === this.newUser.confirmPassword &&
                   this.newUser.password.length >= 8;
        },
        
        canChangePassword() {
            return this.passwordChange.newPassword && 
                   this.passwordChange.newPassword === this.passwordChange.confirmNewPassword &&
                   this.passwordChange.newPassword.length >= 8;
        },
        
        isAdmin() {
            // First user (ID 1) is the admin
            return this.$root.userID === 1;
        }
    },
    
    mounted() {
        this.loadUsers();
        this.initModals();
    },
    
    methods: {
        initModals() {
            this.addUserModal = new Modal(document.getElementById('addUserModal'));
            this.changePasswordModal = new Modal(document.getElementById('changePasswordModal'));
            this.deleteUserModal = new Modal(document.getElementById('deleteUserModal'));
        },
        
        loadUsers() {
            this.loading = true;
            this.$root.getSocket().emit("getUsers", (res) => {
                this.loading = false;
                if (res.ok) {
                    this.users = res.users;
                } else {
                    useToast().error(res.msg);
                }
            });
        },
        
        showAddUserModal() {
            this.newUser = {
                username: "",
                password: "",
                confirmPassword: ""
            };
            this.addUserModal.show();
        },
        
        showChangePasswordModal(user) {
            this.selectedUser = user;
            this.passwordChange = {
                newPassword: "",
                confirmNewPassword: ""
            };
            this.changePasswordModal.show();
        },
        
        showDeleteUserModal(user) {
            this.selectedUser = user;
            this.deleteUserModal.show();
        },
        
        addUser() {
            if (!this.canAddUser) return;
            
            this.$root.getSocket().emit("addUser", this.newUser.username, this.newUser.password, (res) => {
                if (res.ok) {
                    useToast().success(res.msg);
                    this.addUserModal.hide();
                    this.loadUsers();
                } else {
                    useToast().error(res.msg);
                }
            });
        },
        
        changePassword() {
            if (!this.canChangePassword || !this.selectedUser) return;
            
            this.$root.getSocket().emit("changeUserPassword", this.selectedUser.id, this.passwordChange.newPassword, (res) => {
                if (res.ok) {
                    useToast().success(res.msg);
                    this.changePasswordModal.hide();
                } else {
                    useToast().error(res.msg);
                }
            });
        },
        
        deleteUser() {
            if (!this.selectedUser) return;
            
            this.$root.getSocket().emit("deleteUser", this.selectedUser.id, (res) => {
                if (res.ok) {
                    useToast().success(res.msg);
                    this.deleteUserModal.hide();
                    this.loadUsers();
                } else {
                    useToast().error(res.msg);
                }
            });
        },
        
        toggleUserActive(user) {
            if (!this.canManageUser(user)) return;
            
            this.$root.getSocket().emit("toggleUserActive", user.id, (res) => {
                if (res.ok) {
                    useToast().success(res.msg);
                    this.loadUsers();
                } else {
                    useToast().error(res.msg);
                }
            });
        },
        
        canManageUser(user) {
            // Admin can manage all users except themselves for certain actions
            // Regular users can't manage anyone
            return this.isAdmin && user.id !== 1;
        }
    }
};
</script> 