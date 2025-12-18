import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchExpenses } from '@/store/slices/expenseSlice';
import { fetchEmployees, fetchEmployeeExpenses } from '@/store/slices/employeeSlice';
import {
  IndianRupee,
  TrendingUp,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { expenses, isLoading: expensesLoading } = useAppSelector((state) => state.expense);
  const { employees, isLoading: employeesLoading } = useAppSelector((state) => state.employee);

  useEffect(() => {
    dispatch(fetchExpenses());
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Fetch individual employee expenses when employees are loaded
  useEffect(() => {
    if (employees.length > 0) {
      employees.forEach(emp => {
        const id = emp.employee_id || emp.id;
        if (id) {
          dispatch(fetchEmployeeExpenses(id));
        }
      });
    }
  }, [dispatch, employees.map(e => e.employee_id || e.id).join(',')]); // Only re-run if the list of IDs changes

  // Helper to get employee name
  const getEmployeeName = (id: number) => {
    const emp = employees.find(e => e.employee_id === id);
    return emp?.employee_name || emp?.full_name || emp?.full_nmae || 'Unknown Employee';
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount_requested), 0);
  const paidExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount_paid), 0);
  const pendingExpenses = totalExpenses - paidExpenses;

  // Calculate monthly totals dynamically
  const getMonthlyData = () => {
    const last6Months = [];
    const today = new Date();

    // Generate last 6 months keys
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const key = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM format

      last6Months.push({
        key,
        month: monthName,
        amount: 0
      });
    }

    // Aggregate expenses
    expenses.forEach(exp => {
      const dateStr = exp.created_at || exp.updated_at;
      if (!dateStr) return;

      // Extract YYYY-MM from ISO string (e.g., 2025-12-17T...)
      const expMonthKey = dateStr.substring(0, 7);

      const monthData = last6Months.find(m => m.key === expMonthKey);
      if (monthData) {
        monthData.amount += parseFloat(exp.amount_requested || '0');
      }
    });

    return last6Months;
  };

  const monthlyData = getMonthlyData();

  // Vendor (Employee) distribution data
  // Now using the total_expenses fetched from the individual endpoint
  const vendorDistribution = employees.map((emp) => {
    return {
      name: emp.employee_name || emp.full_name || emp.full_nmae || 'Unknown',
      value: emp.total_expenses || 0,
    };
  }).filter(v => v.value > 0);

  console.log('Vendor Distribution Data:', vendorDistribution);
  console.log('Employees:', employees.map(e => ({ name: e.employee_name || e.full_name, total: e.total_expenses })));

  const COLORS = ['hsl(217, 91%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)'];

  const summaryCards = [
    {
      title: 'Total Expenses',
      value: `₹${totalExpenses.toLocaleString()}`,
      icon: IndianRupee,
      change: '+12.5%',
      isPositive: true,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary'
    },
    {
      title: 'Paid Amount',
      value: `₹${paidExpenses.toLocaleString()}`,
      icon: TrendingUp,
      change: '+8.2%',
      isPositive: true,
      bgColor: 'bg-success/10',
      iconColor: 'text-success'
    },
    {
      title: 'Pending Payouts',
      value: `₹${pendingExpenses.toLocaleString()}`,
      icon: Clock,
      change: '-3.1%',
      isPositive: false,
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning'
    },
    {
      title: 'Active Employees/Vendors',
      value: employees.length.toString(),
      icon: Users,
      change: '+2',
      isPositive: true,
      bgColor: 'bg-accent',
      iconColor: 'text-accent-foreground'
    },
  ];

  if (expensesLoading || employeesLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Overview of your expense management</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {summaryCards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className={`p-2 sm:p-2.5 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.iconColor}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${card.isPositive ? 'text-success' : 'text-destructive'
                }`}>
                {card.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span className="hidden sm:inline">{card.change}</span>
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Monthly Trends */}
        <div className="card-elevated p-4 sm:p-6">
          <h2 className="section-title">Monthly Expense Trends</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vendor Distribution */}
        <div className="card-elevated p-4 sm:p-6">
          <h2 className="section-title">Employee/Vendor Distribution</h2>
          <div className="flex flex-col sm:flex-row items-center">
            <ResponsiveContainer width="100%" height={250} className="sm:!w-1/2">
              {vendorDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">No employee expense data available</p>
                </div>
              ) : (
                <LineChart data={vendorDistribution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
            <div className="w-full sm:w-1/2 space-y-2 sm:space-y-3 mt-4 sm:mt-0 pl-0 sm:pl-4">
              {vendorDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No data available</p>
              ) : (
                vendorDistribution.map((vendor, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 bg-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">₹{vendor.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions - Desktop */}
      <div className="card-elevated p-4 sm:p-6 hidden md:block">
        <h2 className="section-title">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Employee/Vendor</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Requested</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Paid</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">No recent transactions</td>
                </tr>
              ) : (
                expenses.slice(0, 5).map((expense) => (
                  <tr key={expense.id} className="table-row-hover border-b border-border last:border-0">
                    <td className="py-4 px-4 text-sm font-medium text-foreground">{getEmployeeName(expense.employee)}</td>
                    <td className="py-4 px-4 text-sm font-semibold text-foreground">₹{parseFloat(expense.amount_requested).toLocaleString()}</td>
                    <td className="py-4 px-4 text-sm font-semibold text-foreground">₹{parseFloat(expense.amount_paid).toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${expense.status === 'PAID'
                        ? 'bg-success/10 text-success'
                        : expense.status === 'PARTIAL'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                        }`}>
                        {expense.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions - Mobile */}
      <div className="md:hidden space-y-3">
        <h2 className="section-title">Recent Transactions</h2>
        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent transactions</p>
        ) : (
          expenses.slice(0, 5).map((expense) => (
            <div key={expense.id} className="card-elevated p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-foreground">{getEmployeeName(expense.employee)}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${expense.status === 'PAID'
                  ? 'bg-success/10 text-success'
                  : expense.status === 'PARTIAL'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-destructive/10 text-destructive'
                  }`}>
                  {expense.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Requested</p>
                  <p className="font-semibold text-foreground">₹{parseFloat(expense.amount_requested).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid</p>
                  <p className="font-semibold text-foreground">₹{parseFloat(expense.amount_paid).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
