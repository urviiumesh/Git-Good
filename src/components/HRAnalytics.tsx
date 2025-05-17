
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for HR analytics
const policyComplianceData = [
  { name: 'Compliant', value: 75 },
  { name: 'Needs Review', value: 15 },
  { name: 'Non-Compliant', value: 10 },
];

const COLORS = ['#0088FE', '#FFBB28', '#FF8042'];

const departmentComplianceData = [
  { department: 'Engineering', compliance: 92 },
  { department: 'Marketing', compliance: 78 },
  { department: 'Sales', compliance: 85 },
  { department: 'HR', compliance: 97 },
  { department: 'Operations', compliance: 81 },
  { department: 'Finance', compliance: 89 },
];

const policyTrendData = [
  { month: 'Jan', updates: 3, reviews: 5 },
  { month: 'Feb', updates: 4, reviews: 7 },
  { month: 'Mar', updates: 2, reviews: 4 },
  { month: 'Apr', updates: 6, reviews: 8 },
  { month: 'May', updates: 4, reviews: 6 },
  { month: 'Jun', updates: 3, reviews: 5 },
];

const policyList = [
  { id: 1, name: 'Employee Handbook', department: 'HR', lastReviewed: '2023-11-15', status: 'Compliant' },
  { id: 2, name: 'Remote Work Policy', department: 'Operations', lastReviewed: '2023-10-22', status: 'Needs Review' },
  { id: 3, name: 'Data Security Guidelines', department: 'IT', lastReviewed: '2023-12-05', status: 'Compliant' },
  { id: 4, name: 'Hiring Procedures', department: 'HR', lastReviewed: '2023-09-18', status: 'Non-Compliant' },
  { id: 5, name: 'Travel Expense Policy', department: 'Finance', lastReviewed: '2024-01-10', status: 'Compliant' },
  { id: 6, name: 'Code of Conduct', department: 'Legal', lastReviewed: '2023-11-30', status: 'Compliant' },
];

export const HRAnalytics: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Filter policies based on search and filters
  const filteredPolicies = policyList.filter(policy => {
    const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || policy.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Department options for filtering
  const departments = ['all', 'HR', 'Operations', 'IT', 'Finance', 'Legal'];
  const statuses = ['all', 'Compliant', 'Needs Review', 'Non-Compliant'];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">HR Policy Analytics</h1>
        <p className="text-muted-foreground">
          Monitor and analyze HR policy compliance and trends
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Policy Compliance</CardTitle>
            <CardDescription>Overall compliance status</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={policyComplianceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {policyComplianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Departmental Compliance</CardTitle>
            <CardDescription>Compliance by department</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentComplianceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="department" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="compliance" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policy Trends</CardTitle>
            <CardDescription>Updates and reviews over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={policyTrendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="updates" stroke="#0088FE" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="reviews" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy Management</CardTitle>
          <CardDescription>Review and manage HR policies</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="policies" className="space-y-4">
            <TabsList>
              <TabsTrigger value="policies">All Policies</TabsTrigger>
              <TabsTrigger value="needs-review">Needs Review</TabsTrigger>
              <TabsTrigger value="non-compliant">Non-Compliant</TabsTrigger>
            </TabsList>
            
            <TabsContent value="policies">
              <div className="space-y-4">
                {/* Search and filters */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search policies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>
                            {dept === 'all' ? 'All Departments' : dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {status === 'all' ? 'All Statuses' : status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Policies table */}
                <div className="border rounded-md">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Policy Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Reviewed</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {filteredPolicies.length > 0 ? (
                        filteredPolicies.map((policy) => (
                          <tr key={policy.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{policy.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{policy.department}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{policy.lastReviewed}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span 
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  policy.status === 'Compliant' ? 'bg-green-100 text-green-800' : 
                                  policy.status === 'Needs Review' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'
                                }`}
                              >
                                {policy.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <Button variant="ghost" size="sm">Review</Button>
                              <Button variant="ghost" size="sm" className="ml-2">History</Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No policies found matching your criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="needs-review">
              {/* Content similar to above but filtered for "Needs Review" */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Displaying policies that require review based on age or compliance issues.
                </p>
                {/* Similar table implementation for needs-review policies */}
              </div>
            </TabsContent>
            
            <TabsContent value="non-compliant">
              {/* Content similar to above but filtered for "Non-Compliant" */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Displaying policies that are currently non-compliant and require immediate attention.
                </p>
                {/* Similar table implementation for non-compliant policies */}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Calendar</CardTitle>
          <CardDescription>Upcoming policy reviews and deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-md p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Employee Handbook Annual Review</h4>
                  <p className="text-sm text-muted-foreground">Due: June 15, 2025</p>
                </div>
                <Button variant="outline" size="sm">Schedule</Button>
              </div>
            </div>
            
            <div className="border rounded-md p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Health & Safety Policy Update</h4>
                  <p className="text-sm text-muted-foreground">Due: July 3, 2025</p>
                </div>
                <Button variant="outline" size="sm">Schedule</Button>
              </div>
            </div>
            
            <div className="border rounded-md p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Remote Work Guidelines Review</h4>
                  <p className="text-sm text-muted-foreground">Due: July 22, 2025</p>
                </div>
                <Button variant="outline" size="sm">Schedule</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRAnalytics;
