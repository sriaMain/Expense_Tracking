import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface UserState {
  users: AppUser[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [
    { id: '1', fullName: 'John Administrator', email: 'admin@company.com', username: 'admin', role: 'admin', createdAt: '2024-01-01' },
    { id: '2', fullName: 'Sarah Finance', email: 'sarah.finance@company.com', username: 'sfinance', role: 'user', createdAt: '2024-01-05' },
    { id: '3', fullName: 'Mike Operations', email: 'mike.ops@company.com', username: 'mops', role: 'user', createdAt: '2024-01-10' },
  ],
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser: (state, action: PayloadAction<Omit<AppUser, 'id' | 'createdAt'>>) => {
      const newUser: AppUser = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      state.users.push(newUser);
    },
    updateUser: (state, action: PayloadAction<AppUser>) => {
      const index = state.users.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter((u) => u.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { addUser, updateUser, deleteUser, setLoading, setError } = userSlice.actions;
export default userSlice.reducer;
