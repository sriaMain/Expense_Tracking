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
                error.response?.data?.error ||
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
    async ({ id, data }: { id: number; data: { username: string } }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`users/${id}/`, data);
            return { id, ...data, message: response.data.message };
        } catch (error: any) {
            console.log(error.response?.data)
            const err = error.response?.data
            return rejectWithValue(err?.error?.[0] || err?.detail || 'Failed to update user')
        }
    }
);

export const toggleUserStatus = createAsyncThunk(
    'users/toggleUserStatus',
    async (
        { id, is_active }: { id: number; is_active: boolean },
        { rejectWithValue }
    ) => {
        try {
            const action = is_active ? 'deactivate' : 'activate';

            await axiosInstance.put(`users/${id}/`, {
                action
            });

            return { id, is_active: !is_active };
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error ||
                error.response?.data?.detail ||
                'Failed to update user status'
            );
        }
    }
);

export const resetPassword = createAsyncThunk(
    'users/resetPassword',
    async ({ id, new_password }: { id: number; new_password: string }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`reset-password/`, { new_password });
            return response.data;
        } catch (error: any) {
            const err = error.response?.data;
            return rejectWithValue(err?.error?.[0] || err?.error || err?.detail || 'Failed to reset password');
        }
    }
);

export const changePassword = createAsyncThunk(
    'users/changePassword',
    async ({ email, old_password, new_password }: { email: string; old_password?: string; new_password: string }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`change-password/`, { new_password, old_password, email });
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
                    state.users[index] = { ...state.users[index], username: action.payload.username };
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
