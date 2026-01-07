import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchAllExpensesAndRecurring } from '@/store/slices/expenseSlice';
import { fetchVendors, fetchVendorExpenses } from '@/store/slices/vendorSlice';
import {
  IndianRupee,
  TrendingUp,
  Users,
  Clock,
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
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { expenses, isLoading: expensesLoading } = useAppSelector((state) => state.expense);
  const { vendors, isLoading: vendorsLoading } = useAppSelector((state) => state.vendor);

  useEffect(() => {
    dispatch(fetchAllExpensesAndRecurring());
    dispatch(fetchVendors());
  }, [dispatch]);

  // Fetch individual vendor expenses when vendors are loaded
  useEffect(() => {
    if (vendors.length > 0) {
      vendors.forEach(vendor => {
        if (vendor.id) {
          dispatch(fetchVendorExpenses(vendor.id));
        }
      });
    }
  }, [dispatch, vendors.map(v => v.id).join(',')]);

  // Helper to get vendor name
  const getVendorName = (id: number | string) => {
    if (typeof id === 'string') return id;
    const vendor = vendors.find(v => v.id === id);
    return vendor?.name || 'Unknown Vendor';
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount_requested), 0);
  const paidExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount_paid), 0);
  const pendingExpenses = totalExpenses - paidExpenses;

  // Calculate monthly totals dynamically
  const getMonthlyData = () => {
    const last6Months = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const key = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      last6Months.push({
        key,
        month: monthName,
        amount: 0
      });
    }

    expenses.forEach(exp => {
      const dateStr = exp.created_at || exp.updated_at;
      if (!dateStr) return;
      const expMonthKey = dateStr.substring(0, 7);
      const monthData = last6Months.find(m => m.key === expMonthKey);
      if (monthData) {
        monthData.amount += parseFloat(exp.amount_requested || '0');
      }
    });

    return last6Months;
  };

  const monthlyData = getMonthlyData();

  const vendorDistribution = vendors.map((vendor) => {
    const totalRemaining = (vendor.expenses || []).reduce((sum: number, exp) => sum + parseFloat(exp.remaining_amount || '0'), 0);
    return {
      name: vendor.name || 'Unknown',
      value: totalRemaining,
    };
  })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const prevRef = useRef({
    totalExpenses: 0,
    paidExpenses: 0,
    pendingExpenses: 0,
    activeCount: 0,
  });

  const formatChange = (val: number) => {
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  const totalChange = prevRef.current.totalExpenses === 0 ? 0 : ((totalExpenses - prevRef.current.totalExpenses) / prevRef.current.totalExpenses) * 100;
  const paidChange = prevRef.current.paidExpenses === 0 ? 0 : ((paidExpenses - prevRef.current.paidExpenses) / prevRef.current.paidExpenses) * 100;
  const pendingChange = prevRef.current.pendingExpenses === 0 ? 0 : ((pendingExpenses - prevRef.current.pendingExpenses) / prevRef.current.pendingExpenses) * 100;
  const activeChange = prevRef.current.activeCount === 0 ? 0 : ((vendors.length - prevRef.current.activeCount) / prevRef.current.activeCount) * 100;

  const summaryCards = [
    {
      title: 'Total Expenses',
      value: `₹${totalExpenses.toLocaleString()}`,
      icon: IndianRupee,
      change: formatChange(totalChange),
      isPositive: totalChange >= 0,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Paid Amount',
      value: `₹${paidExpenses.toLocaleString()}`,
      icon: TrendingUp,
      change: formatChange(paidChange),
      isPositive: paidChange >= 0,
      bgColor: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      title: 'Pending Payouts',
      value: `₹${pendingExpenses.toLocaleString()}`,
      icon: Clock,
      change: formatChange(pendingChange),
      isPositive: pendingChange <= 0,
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      title: 'Active Vendors',
      value: vendors.length.toString(),
      icon: Users,
      change: formatChange(activeChange),
      isPositive: activeChange >= 0,
      bgColor: 'bg-accent',
      iconColor: 'text-accent-foreground',
    },
  ];

  useEffect(() => {
    prevRef.current = {
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      activeCount: vendors.length,
    };
  }, [totalExpenses, paidExpenses, pendingExpenses, vendors.length]);

  if (expensesLoading || vendorsLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const sortedExpenses = [...expenses].sort((a, b) => b.id - a.id);

  return (
    <div className="animate-fade-in pb-20">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Overview of your expense management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {summaryCards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className={`p-2 sm:p-2.5 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="card-elevated p-4 sm:p-6">
          <h2 className="section-title">Monthly Expense Trends</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                domain={[0, 'auto']}
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
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated p-4 sm:p-6">
          <h2 className="section-title">Top 5 Vendor Distribution</h2>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={250}>
              {vendorDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">No vendor expense data available</p>
                </div>
              ) : (
                <LineChart data={vendorDistribution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 'auto']}
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
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-elevated p-4 sm:p-6 hidden md:block">
        <h2 className="section-title">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vendor</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Requested</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Paid</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Remaining Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">No recent transactions</td>
                </tr>
              ) : (
                sortedExpenses.slice(0, 5).map((expense) => (
                  <tr
                    key={expense.id}
                    onClick={() => navigate(`/expenses/${expense.id}`)}
                    className="table-row-hover border-b border-border last:border-0 cursor-pointer"
                  >
                    <td className="py-4 px-4 text-sm font-medium text-foreground">{getVendorName(expense.vendor)}</td>
                    <td className="py-4 px-4 text-sm font-semibold text-foreground">₹{parseFloat(expense.amount_requested).toLocaleString()}</td>
                    <td className="py-4 px-4 text-sm font-semibold text-foreground">₹{parseFloat(expense.amount_paid).toLocaleString()}</td>
                    <td className="py-4 px-4 text-sm font-semibold text-foreground">₹{parseFloat(expense.remaining_amount).toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${expense.status === 'PAID'
                        ? 'bg-success/10 text-success'
                        : (expense.status === 'PARTIAL' || expense.status === 'PARTIAL_PAID' || expense.status === 'PARTIALLY_PAID')
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                        }`}>
                        {expense.status === 'PARTIAL_PAID' || expense.status === 'PARTIALLY_PAID' ? 'PARTIAL' : expense.status === 'UNPAID' ? 'PENDING' : expense.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        <h2 className="section-title">Recent Transactions</h2>
        {sortedExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent transactions</p>
        ) : (
          sortedExpenses.slice(0, 5).map((expense) => (
            <div
              key={expense.id}
              onClick={() => navigate(`/expenses/${expense.id}`)}
              className="card-elevated p-4 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-foreground">{getVendorName(expense.vendor)}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${expense.status === 'PAID'
                  ? 'bg-success/10 text-success'
                  : (expense.status === 'PARTIAL' || expense.status === 'PARTIAL_PAID' || expense.status === 'PARTIALLY_PAID')
                    ? 'bg-warning/10 text-warning'
                    : 'bg-destructive/10 text-destructive'
                  }`}>
                  {expense.status === 'PARTIAL_PAID' || expense.status === 'PARTIALLY_PAID' ? 'PARTIAL' : expense.status === 'UNPAID' ? 'PENDING' : expense.status}
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
                <div>
                  <p className="text-muted-foreground">Remaining</p>
                  <p className="font-semibold text-foreground">₹{parseFloat(expense.remaining_amount).toLocaleString()}</p>
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
