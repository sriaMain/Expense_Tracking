import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { logout } from '@/store/slices/authSlice';
import { changePassword } from '@/store/slices/userSlice';
import {
  LayoutDashboard,
  Receipt,
  FileBarChart,
  Users,
  LogOut,
  IndianRupee,
  Menu,
  X,
  Key,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/lib/axiosInstance';

const Navbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // const handleLogout = () => {
  //   dispatch(logout());
  //   axiosInstance.post('logout/')
  //   toast.success('Logged out successfully');
  //   navigate('/');
  //   setMobileMenuOpen(false);
  // };

  async function handleSignOut(e) {
    e?.preventDefault?.();

    const refresh = localStorage.getItem('refresh') || sessionStorage.getItem('refresh');

    try {
      // if (refresh) {
      await axiosInstance.post('logout/', { refresh });
      // } else {
      //   // if refresh stored in HttpOnly cookie, backend will read it — send credentials
      //   await axiosInstance.post('logout/', null, { withCredentials: true });
      // }
    } catch (err) {
      // ignore errors — still sign out client-side
    } finally {
      // clear redux state + client storage, notify and redirect
      dispatch(logout());
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      sessionStorage.removeItem('access');
      sessionStorage.removeItem('refresh');
      toast.success('Logged out successfully');
      setDropdownOpen(false);
      setMobileMenuOpen(false);
      navigate('/');
    }
  }
  const handleResetPassword = async () => {
    if (!user?.id) {
      toast.error('User session invalid. Please login again.');
      return;
    }
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    try {
      // Assuming user.id is available and matches the backend ID type (string/number)
      // userSlice expects number, authSlice has string. Need to cast.
      await dispatch(changePassword({
        email: user.email,
        old_password: currentPassword,
        new_password: newPassword
      })).unwrap();

      toast.success('Password updated successfully');
      setShowResetModal(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      toast.error((error as string) || 'Failed to update password');
    }
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/reports', icon: FileBarChart, label: 'Reports' },
    { to: '/users', icon: Users, label: 'Users' },
  ];

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => mobile && setMobileMenuOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${isActive
              ? 'bg-primary/10 text-primary'
              : 'text-foreground/70 hover:bg-muted hover:text-foreground'
            } ${mobile ? 'w-full justify-start' : ''}`
          }
        >
          <item.icon className="w-4 h-4" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <>
      <nav className="sticky top-0 z-40 w-full bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground hidden sm:block">ExpenseFlow</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <NavItems />
            </div>

            {/* User Info & Dropdown - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <div
                className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{user?.username}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          setShowResetModal(true);
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2 text-foreground"
                      >
                        <Key className="w-4 h-4" />
                        Reset Password
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-card overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2">
                <NavItems mobile />

                <div className="pt-4 mt-4 border-t border-border">
                  <div className="px-4 py-2 mb-2">
                    <p className="text-sm font-medium text-foreground">{user?.username}</p>
                    {/* <p className="text-xs text-muted-foreground">{user?.email}</p> */}
                  </div>
                  <button
                    onClick={() => {
                      setShowResetModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors mb-1"
                  >
                    <Key className="w-4 h-4" />
                    <span>Reset Password</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay flex items-center justify-center p-6 backdrop-blur-sm"
            onClick={() => setShowResetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-elevated w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleResetPassword} className="btn-primary flex-1">
                    Update Password
                  </button>
                  <button
                    onClick={() => { setShowResetModal(false); setCurrentPassword(''); setNewPassword(''); }}
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
    </>
  );
};

export default Navbar;
