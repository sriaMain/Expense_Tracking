import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchUsers, addUser, updateUser, toggleUserStatus, AppUser } from '@/store/slices/userSlice';
import { Plus, X, User, Mail, AtSign, Loader2, MoreVertical, Key, Edit2, Ban, CheckCircle, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const UsersPage = () => {
  const dispatch = useAppDispatch();
  const { users, isLoading } = useAppSelector((state) => state.users);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Selected User for actions
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleAddUser = async () => {
    if (!email || !username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      await dispatch(addUser({
        email,
        username,
        password,
      })).unwrap();

      toast.success('User added successfully');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      toast.error((error as string) || 'Failed to add user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !username) return;

    try {
      await dispatch(updateUser({
        id: selectedUser.id,
        data: { username }
      })).unwrap();

      toast.success('User updated successfully');
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      toast.error((error as string) || 'Failed to update user');
    }
  };

  const handleToggleUserStatus = async (user: AppUser) => {
    const action = user.is_active ? 'inactive' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${user.username}?`)) return;

    try {
      await dispatch(toggleUserStatus({ id: user.id, is_active: user.is_active })).unwrap();
      toast.success(`${user.username} has been ${action}d`);
    } catch (error) {
      toast.error((error as string) || `Failed to ${action} user`);
    }
  };

  const openEditModal = (user: AppUser) => {
    setSelectedUser(user);
    setEmail(user.email);
    setUsername(user.username);
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setSelectedUser(null);
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts and access</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {isLoading && users.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        /* Users Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="stat-card relative group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-accent-foreground">
                    {user.username.substring(0, 2).toUpperCase()}
                  </span>
                </div>

                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === user.id ? null : user.id);
                    }}
                    className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeDropdown === user.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={() => openEditModal(user)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2 text-foreground"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit User
                      </button>

                      <button
                        onClick={() => handleToggleUserStatus(user)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2 ${user.is_active ? 'text-destructive hover:bg-destructive/10' : 'text-success hover:bg-success/10'
                          }`}
                      >
                        <Power className="w-4 h-4" />
                        {user.is_active ? 'Inactive User' : 'Active User'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-foreground mb-1">{user.username}</h3>
              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${user.is_active
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
                  }`}>
                  {user.is_active ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <Ban className="w-3 h-3" />
                      Inactive
                    </>
                  )}
                </span>
                {user.role && (
                  <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay flex items-center justify-center p-6"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-elevated w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Add New User</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <AtSign className="w-4 h-4 inline mr-2" />
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Key className="w-4 h-4 inline mr-2" />
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleAddUser} className="btn-primary flex-1">
                    Add User
                  </button>
                  <button
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay flex items-center justify-center p-6"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-elevated w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Edit User</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="input-field opacity-60 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter user name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleUpdateUser} className="btn-primary flex-1">
                    Update User
                  </button>
                  <button
                    onClick={() => { setShowEditModal(false); resetForm(); }}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;
