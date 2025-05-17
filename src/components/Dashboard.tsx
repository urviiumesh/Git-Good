
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "@/components/StatusIndicator";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// Mock data for charts
const usageData = [
  { name: 'Mon', queries: 120, documents: 45 },
  { name: 'Tue', queries: 160, documents: 58 },
  { name: 'Wed', queries: 180, documents: 75 },
  { name: 'Thu', queries: 190, documents: 80 },
  { name: 'Fri', queries: 170, documents: 62 },
  { name: 'Sat', queries: 90, documents: 30 },
  { name: 'Sun', queries: 75, documents: 25 },
];

const modelPerformance = [
  { name: 'Response Time', value: 85 },
  { name: 'Accuracy', value: 92 },
  { name: 'Satisfaction', value: 88 },
  { name: 'Compliance', value: 95 },
];

export const Dashboard: React.FC = () => {
  // Mock system statuses
  const systemStatuses = [
    { name: 'Model Engine', status: 'online' as const },
    { name: 'Document Database', status: 'online' as const },
    { name: 'Authentication', status: 'online' as const },
    { name: 'Analytics Service', status: 'degraded' as const },
  ];

  // Mock recent activity
  const recentActivity = [
    { id: 1, action: 'Document query', user: 'john.doe', time: '10 minutes ago', status: 'completed' },
    { id: 2, action: 'Code generation', user: 'jane.smith', time: '25 minutes ago', status: 'completed' },
    { id: 3, action: 'HR policy analysis', user: 'hr.manager', time: '1 hour ago', status: 'completed' },
    { id: 4, action: 'System update', user: 'system', time: '3 hours ago', status: 'completed' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, Admin</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your EdgeGPT system today.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,345</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">845</div>
            <p className="text-xs text-muted-foreground mt-1">+5% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground mt-1">+2 new today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Good</div>
            <p className="text-xs text-muted-foreground mt-1">3 services optimized</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Usage</CardTitle>
            <CardDescription>Query and document processing trends</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={usageData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="queries" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorQueries)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="documents" 
                  stroke="#0ea5e9" 
                  fillOpacity={1} 
                  fill="url(#colorDocs)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Model Performance</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={modelPerformance}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System status and activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current service health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemStatuses.map((item) => (
                <div key={item.name} className="flex justify-between items-center">
                  <span className="font-medium text-sm">{item.name}</span>
                  <StatusIndicator status={item.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex justify-between pb-2 border-b border-border last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{item.action}</p>
                    <p className="text-xs text-muted-foreground">By {item.user}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                    <p className={`text-xs ${
                      item.status === 'completed' ? 'text-green-500' : 
                      item.status === 'pending' ? 'text-yellow-500' : 
                      'text-red-500'
                    }`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
