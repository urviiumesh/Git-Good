
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter, Info, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Mock audit log data
type AuditLogEntry = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  status: 'success' | 'failure' | 'warning';
  ipAddress: string;
  details: string;
};

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: '2025-05-16 09:23:15',
    user: 'john.doe',
    action: 'LOGIN',
    resource: 'Auth System',
    status: 'success',
    ipAddress: '192.168.1.105',
    details: 'Successful login via SSO',
  },
  {
    id: '2',
    timestamp: '2025-05-16 09:24:32',
    user: 'john.doe',
    action: 'QUERY',
    resource: 'Document Database',
    status: 'success',
    ipAddress: '192.168.1.105',
    details: 'Queried employee handbook document',
  },
  {
    id: '3',
    timestamp: '2025-05-16 10:05:47',
    user: 'jane.smith',
    action: 'QUERY',
    resource: 'Code Generation API',
    status: 'success',
    ipAddress: '192.168.1.108',
    details: 'Generated authentication middleware code',
  },
  {
    id: '4',
    timestamp: '2025-05-16 10:15:23',
    user: 'admin',
    action: 'UPDATE',
    resource: 'User Management',
    status: 'success',
    ipAddress: '192.168.1.1',
    details: 'Updated user role permissions',
  },
  {
    id: '5',
    timestamp: '2025-05-16 10:18:05',
    user: 'jane.smith',
    action: 'ACCESS_DENIED',
    resource: 'HR Analytics',
    status: 'failure',
    ipAddress: '192.168.1.108',
    details: 'Attempted to access restricted HR data',
  },
  {
    id: '6',
    timestamp: '2025-05-16 10:45:12',
    user: 'system',
    action: 'BACKUP',
    resource: 'Database',
    status: 'success',
    ipAddress: 'localhost',
    details: 'Automated daily backup performed',
  },
  {
    id: '7',
    timestamp: '2025-05-16 11:02:38',
    user: 'hr.manager',
    action: 'EXPORT',
    resource: 'HR Analytics',
    status: 'success',
    ipAddress: '192.168.1.110',
    details: 'Exported compliance report to PDF',
  },
  {
    id: '8',
    timestamp: '2025-05-16 11:15:53',
    user: 'john.doe',
    action: 'UPDATE_FAILED',
    resource: 'Personal Settings',
    status: 'warning',
    ipAddress: '192.168.1.105',
    details: 'Password update failed - complexity requirements not met',
  },
  {
    id: '9',
    timestamp: '2025-05-16 11:30:27',
    user: 'admin',
    action: 'CONFIG_CHANGE',
    resource: 'System Settings',
    status: 'success',
    ipAddress: '192.168.1.1',
    details: 'Modified session timeout settings',
  },
  {
    id: '10',
    timestamp: '2025-05-16 12:05:44',
    user: 'jane.smith',
    action: 'LOGOUT',
    resource: 'Auth System',
    status: 'success',
    ipAddress: '192.168.1.108',
    details: 'User initiated logout',
  },
];

export const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');

  // Filter logs based on search and filters
  const filteredLogs = mockAuditLogs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    // For simplicity, we're not actually filtering by date in this example
    return matchesSearch && matchesAction && matchesStatus;
  });

  // Unique actions for filtering
  const actions = ['all', ...Array.from(new Set(mockAuditLogs.map(log => log.action)))];
  
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track and analyze system and user activities
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Comprehensive record of system activities and user interactions</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Download size={16} />
                Export
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter size={16} />
                Advanced Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs by user, action or resource..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="flex gap-3 flex-col sm:flex-row">
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    {actions.map(action => (
                      <SelectItem key={action} value={action}>
                        {action === 'all' ? 'All Actions' : action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failure">Failure</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results info */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredLogs.length} of {mockAuditLogs.length} log entries
            </div>

            {/* Log table */}
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Timestamp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Resource</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">IP Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{log.timestamp}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{log.user}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{log.action}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{log.resource}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              log.status === 'success' ? 'bg-green-100 text-green-800' : 
                              log.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{log.ipAddress}</td>
                        <td className="px-4 py-3 text-sm max-w-xs truncate">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                                {log.details.length > 30 ? `${log.details.substring(0, 30)}...` : log.details}
                                {log.details.length > 30 && <Info size={14} />}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{log.details}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing 1 to {filteredLogs.length} of {filteredLogs.length} results
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" disabled>Next</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Reports</CardTitle>
            <CardDescription>Generate detailed compliance reports for audit purposes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md p-4 bg-muted/30 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">GDPR Compliance Report</h4>
                  <p className="text-sm text-muted-foreground">Records of all data access and processing activities</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download size={16} />
                  Generate
                </Button>
              </div>
              
              <div className="border rounded-md p-4 bg-muted/30 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">HIPAA Compliance Report</h4>
                  <p className="text-sm text-muted-foreground">Health information access and security measures</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download size={16} />
                  Generate
                </Button>
              </div>
              
              <div className="border rounded-md p-4 bg-muted/30 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Security Incident Report</h4>
                  <p className="text-sm text-muted-foreground">Details of security events and resolution measures</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download size={16} />
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health Monitoring</CardTitle>
            <CardDescription>Track system performance and security metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Authentication Success Rate</h4>
                  <span className="text-green-500 font-medium">98.5%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">API Response Time</h4>
                  <span className="text-green-500 font-medium">238ms</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Failed Security Checks</h4>
                  <span className="text-red-500 font-medium">2</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Unauthorized Access Attempts</h4>
                  <span className="text-yellow-500 font-medium">15</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-2">View Detailed Analytics</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditLogs;
