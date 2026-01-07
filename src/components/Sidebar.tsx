import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  FileBarChart,
  Users,
  Store,
  LogOut,
  Briefcase,
  Tag
} from 'lucide-react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { logout } from '@/store/slices/authSlice';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users', icon: Users, label: 'Users' },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/vendors', icon: Store, label: 'Vendors' },
    { to: '/projects', icon: Briefcase, label: 'Projects' },
    { to: '/categories', icon: Tag, label: 'Categories' },
    { to: '/reports', icon: FileBarChart, label: 'Reports' },
  ];

  const handleSignOut = async () => {
    const refresh = localStorage.getItem('refresh') || sessionStorage.getItem('refresh');

    try {
      await axiosInstance.post('logout/', { refresh });
    } catch (err) {
      // ignore errors — still sign out client-side
    } finally {
      dispatch(logout());
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      sessionStorage.removeItem('access');
      sessionStorage.removeItem('refresh');
      toast.success('Logged out successfully');
      navigate('/');
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-card border-r border-border flex flex-col items-center py-4 z-50 hidden md:flex">
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-8">
        {/* Logo placeholder */}
      </div>

      <nav className="flex flex-col gap-4 w-full px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <item.icon className="w-5 h-5" />

            {/* Tooltip */}
            <div className="absolute left-14 px-2 py-1 bg-popover border border-border rounded-md text-xs font-medium text-popover-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-md">
              {item.label}
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-popover border-l border-b border-border rotate-45" />
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto w-full px-2">
        <button
          onClick={handleSignOut}
          className="relative group flex items-center justify-center w-12 h-12 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />

          {/* Tooltip */}
          <div className="absolute left-14 px-2 py-1 bg-popover border border-border rounded-md text-xs font-medium text-popover-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-md">
            Sign Out
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-popover border-l border-b border-border rotate-45" />
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
