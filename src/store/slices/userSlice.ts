import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axiosInstance';

export interface AppUser {
    id: number;
    username: string;
    email: string;
    is_active: boolean;
    // Optional fields based on existing code/potential backend response
    fullName?: string;
    role?: string;
    createdAt?: string;
}

interface UserState {
    users: AppUser[];
    isLoading: boolean;
    error: string | null;
}

const initialState: UserState = {
    users: [],
    isLoading: false,
    error: null,
};

// Async Thunks
export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('users/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                error.message ||
                'Failed to fetch users'
            );
        }
    }
);

export const addUser = createAsyncThunk(
    'users/addUser',
    async (userData: { username: string; email: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('users/', userData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error ||
                error.response?.data?.detail ||
                'Failed to add user'
            );
        }
    }
);

export const updateUser = createAsyncThunk(
    'users/updateUser',
    async ({ id, data }: { id: number; data: { email: string } }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`users/${id}/`, data);
            return { id, ...data, message: response.data.message };
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error ||
                error.response?.data?.detail ||
                'Failed to update user'
            );
        }
    }
);

export const toggleUserStatus = createAsyncThunk(
    'users/toggleUserStatus',
    async ({ id, is_active }: { id: number; is_active: boolean }, { rejectWithValue }) => {
        try {
            // If is_active is true, we want to deactivate (DELETE /users/{id}/)
            // If is_active is false, we want to activate (POST /users/{id}/activate/ ?)
            // The prompt says "instead of disable user give inactive id the user is active and if user is inactive then give active user"
            // This implies a toggle.
            // The original prompt only gave DELETE /api/users/3/ for "DISABLE USER (Soft Delete)".
            // It didn't explicitly give an "ACTIVATE USER" endpoint.
            // However, usually soft delete is just setting is_active=False.
            // To re-activate, we'd need an endpoint.
            // I'll assume a standard pattern or try to use PUT to update is_active if possible, but the PUT example was "UPDATE USER (Email Only)".
            // Let's look at the "DISABLE USER" again. It says "DELETE /api/users/3/".
            // If I want to activate, maybe there is a specific endpoint or I should try PUT with is_active?
            // But the PUT example was restricted.
            // I will assume for now that I can use a hypothetical `users/{id}/activate/` or just try to PUT `is_active`.
            // BUT, the user prompt specifically said "instead of disable user give inactive id the user is active and if user is inactive then give active user".
            // This sounds like I should change the UI action to be a toggle.
            // If I don't have an endpoint for activation, I might be stuck.
            // Let's assume there's an endpoint `POST /api/users/{id}/activate/` or similar for the sake of the feature, or maybe `PUT` works for `is_active` too despite the example.
            // Actually, often "DELETE" toggles or there is a restore.
            // Let's try to use a new thunk `toggleUserStatus`.

            if (is_active) {
                // Currently active, so disable
                await axiosInstance.delete(`users/${id}/`);
                return { id, is_active: false };
            } else {
                // Currently inactive, so activate. 
                // I'll try a specific activate endpoint as it's common with soft deletes.
                await axiosInstance.post(`users/${id}/activate/`);
                return { id, is_active: true };
            }
        } catch (error: any) {
            // Fallback: maybe PUT works?
            try {
                if (!is_active) {
                    await axiosInstance.put(`users/${id}/`, { is_active: true });
                    return { id, is_active: true };
                }
                throw error;
            } catch (e) {
                return rejectWithValue(
                    error.response?.data?.error ||
                    error.response?.data?.detail ||
                    'Failed to update user status'
                );
            }
        }
    }
);

export const resetPassword = createAsyncThunk(
    'users/resetPassword',
    async ({ id, new_password }: { id: number; new_password: string }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`users/${id}/reset-password/`, { new_password });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error ||
                error.response?.data?.detail ||
                'Failed to reset password'
            );
        }
    }
);

export const changePassword = createAsyncThunk(
    'users/changePassword',
    async ({ id, old_password, new_password }: { id: number; old_password?: string; new_password: string }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`users/${id}/change-password/`, { new_password, old_password });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error ||
                error.response?.data?.detail ||
                'Failed to change password'
            );
        }
    }
);

const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch Users
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.users = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Add User
        builder
            .addCase(addUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(addUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.users.push({ ...action.payload, is_active: true }); // Assume active on creation
            })
            .addCase(addUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Update User
        builder
            .addCase(updateUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.users.findIndex(u => u.id === action.payload.id);
                if (index !== -1) {
                    state.users[index] = { ...state.users[index], email: action.payload.email };
                }
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Toggle User Status
        builder
            .addCase(toggleUserStatus.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(toggleUserStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.users.findIndex(u => u.id === action.payload.id);
                if (index !== -1) {
                    state.users[index].is_active = action.payload.is_active;
                }
            })
            .addCase(toggleUserStatus.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Reset Password
        builder
            .addCase(resetPassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Change Password
        builder
            .addCase(changePassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(changePassword.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(changePassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;
