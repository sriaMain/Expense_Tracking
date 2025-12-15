import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { logout } from '@/store/slices/authSlice';
import { 
  LayoutDashboard, 
  Receipt, 
  FileBarChart, 
  Users, 
  LogOut,
  DollarSign 
} from 'lucide-react';
import { toast } from 'sonner';

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/expenses', icon: Receipt, label: 'Expense Records' },
    { to: '/reports', icon: FileBarChart, label: 'Reports' },
    { to: '/users', icon: Users, label: 'Users' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">ExpenseFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="mb-4 px-4">
          <p className="text-sm font-medium text-sidebar-foreground">{user?.fullName}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
