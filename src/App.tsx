import { Provider } from 'react-redux';
import { store } from '@/store';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ExpenseRecords from "./pages/ExpenseRecords";
import AddExpense from "./pages/AddExpense";
import Reports from "./pages/Reports";
import UsersPage from "./pages/UsersPage";
import Vendors from "./pages/Vendors";
import AddVendor from "./pages/AddVendor";
import VendorDetails from "./pages/VendorDetails";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Categories from "./pages/Categories";
import RecurringExpenseDetails from "./pages/RecurringExpenseDetails";
import ExpenseDetails from "./pages/ExpenseDetails";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
            <Route path="/expenses" element={<DashboardLayout><ExpenseRecords /></DashboardLayout>} />
            <Route path="/expenses/:id" element={<DashboardLayout><ExpenseDetails /></DashboardLayout>} />
            <Route path="/expenses/add" element={<DashboardLayout><AddExpense /></DashboardLayout>} />
            <Route path="/reports" element={<DashboardLayout><Reports /></DashboardLayout>} />
            <Route path="/users" element={<DashboardLayout><UsersPage /></DashboardLayout>} />
            <Route path="/vendors" element={<DashboardLayout><Vendors /></DashboardLayout>} />
            <Route path="/vendors/:id" element={<DashboardLayout><VendorDetails /></DashboardLayout>} />
            <Route path="/vendors/add" element={<DashboardLayout><AddVendor /></DashboardLayout>} />
            <Route path="/vendors/edit/:id" element={<DashboardLayout><AddVendor /></DashboardLayout>} />
            <Route path="/projects" element={<DashboardLayout><Projects /></DashboardLayout>} />
            <Route path="/projects/:id" element={<DashboardLayout><ProjectDetails /></DashboardLayout>} />
            <Route path="/categories" element={<DashboardLayout><Categories /></DashboardLayout>} />
            <Route path="/recurring-expenses/:id" element={<DashboardLayout><RecurringExpenseDetails /></DashboardLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
