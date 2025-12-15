import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { addUser, deleteUser } from '@/store/slices/userSlice';
import { Plus, X, Trash2, User, Mail, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const UsersPage = () => {
  const dispatch = useAppDispatch();
  const { users } = useAppSelector((state) => state.users);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  const handleAddUser = () => {
    if (!fullName || !email || !username) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check for duplicate username
    if (users.some(u => u.username === username)) {
      toast.error('Username already exists');
      return;
    }

    dispatch(addUser({
      fullName,
      email,
      username,
      role: 'user',
    }));

    toast.success('User added successfully');
    setShowModal(false);
    resetForm();
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (id === '1') {
      toast.error('Cannot delete the admin user');
      return;
    }
    dispatch(deleteUser(id));
    toast.success(`${name} has been removed`);
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setUsername('');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts and access</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-accent-foreground">
                  {user.fullName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              {user.id !== '1' && (
                <button
                  onClick={() => handleDeleteUser(user.id, user.fullName)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <h3 className="font-semibold text-foreground mb-1">{user.fullName}</h3>
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AtSign className="w-4 h-4" />
                {user.username}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                user.role === 'admin' 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
              <span className="text-xs text-muted-foreground">Added {user.createdAt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay flex items-center justify-center p-6"
            onClick={() => setShowModal(false)}
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
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
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

                <div className="flex gap-3 pt-2">
                  <button onClick={handleAddUser} className="btn-primary flex-1">
                    Add User
                  </button>
                  <button 
                    onClick={() => { setShowModal(false); resetForm(); }} 
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
