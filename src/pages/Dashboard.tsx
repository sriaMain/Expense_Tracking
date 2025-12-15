import { useAppSelector } from '@/hooks/useAppDispatch';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = () => {
  const { expenses, vendors } = useAppSelector((state) => state.expense);

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const paidExpenses = expenses.filter(exp => exp.status === 'paid').reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpenses = expenses.filter(exp => exp.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0);

  // Monthly chart data
  const monthlyData = [
    { month: 'Jul', amount: 18500 },
    { month: 'Aug', amount: 24200 },
    { month: 'Sep', amount: 21800 },
    { month: 'Oct', amount: 28400 },
    { month: 'Nov', amount: 32100 },
    { month: 'Dec', amount: 26700 },
    { month: 'Jan', amount: totalExpenses },
  ];

  // Vendor distribution data
  const vendorDistribution = vendors.map((vendor, index) => {
    const vendorTotal = expenses
      .filter(exp => exp.vendorId === vendor.id)
      .reduce((sum, exp) => sum + exp.amount, 0);
    return {
      name: vendor.name,
      value: vendorTotal,
    };
  }).filter(v => v.value > 0);

  const COLORS = ['hsl(217, 91%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)'];

  const summaryCards = [
    { 
      title: 'Total Expenses', 
      value: `$${totalExpenses.toLocaleString()}`, 
      icon: DollarSign, 
      change: '+12.5%', 
      isPositive: true,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary'
    },
    { 
      title: 'Paid Amount', 
      value: `$${paidExpenses.toLocaleString()}`, 
      icon: TrendingUp, 
      change: '+8.2%', 
      isPositive: true,
      bgColor: 'bg-success/10',
      iconColor: 'text-success'
    },
    { 
      title: 'Pending Payouts', 
      value: `$${pendingExpenses.toLocaleString()}`, 
      icon: Clock, 
      change: '-3.1%', 
      isPositive: false,
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning'
    },
    { 
      title: 'Active Vendors', 
      value: vendors.length.toString(), 
      icon: Users, 
      change: '+2', 
      isPositive: true,
      bgColor: 'bg-accent',
      iconColor: 'text-accent-foreground'
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your expense management</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryCards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                card.isPositive ? 'text-success' : 'text-destructive'
              }`}>
                {card.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trends */}
        <div className="card-elevated p-6">
          <h2 className="section-title">Monthly Expense Trends</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vendor Distribution */}
        <div className="card-elevated p-6">
          <h2 className="section-title">Vendor-wise Distribution</h2>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={280}>
              <PieChart>
                <Pie
                  data={vendorDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  stroke="none"
                >
                  {vendorDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-3">
              {vendorDistribution.map((vendor, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">${vendor.value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card-elevated p-6">
        <h2 className="section-title">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vendor</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Reason</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.slice(0, 5).map((expense) => (
                <tr key={expense.id} className="table-row-hover border-b border-border last:border-0">
                  <td className="py-4 px-4 text-sm font-medium text-foreground">{expense.vendorName}</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{expense.reason}</td>
                  <td className="py-4 px-4 text-sm font-semibold text-foreground">${expense.amount.toLocaleString()}</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{expense.date}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      expense.status === 'paid' 
                        ? 'bg-success/10 text-success' 
                        : expense.status === 'pending'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
