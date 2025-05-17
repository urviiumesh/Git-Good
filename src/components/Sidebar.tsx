import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icons } from '@/components/ui/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
    navigate('/auth/login');
  };

  const navItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: Icons.layoutDashboard,
    },
    {
      title: 'Chat',
      href: '/chat',
      icon: Icons.messageSquare,
    },
    {
      title: 'Code Generation',
      href: '/code',
      icon: Icons.code,
    },
    {
      title: 'HR Analytics',
      href: '/hr-analytics',
      icon: Icons.barChart,
    },
    {
      title: 'Audit Logs',
      href: '/audit',
      icon: Icons.fileText,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Icons.settings,
    },
  ];

  return (
    <div className={cn("flex flex-col h-screen border-r bg-background flex-shrink-0", isCollapsed ? "w-16 sm:w-16" : "w-64 sm:w-64", className)}>
      <div className="flex items-center py-2 px-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex-shrink-0"
        >
          <Icons.alignJustify className="h-5 w-5" />
        </Button>
        {!isCollapsed && (
          <h2 className="text-lg font-semibold tracking-tight ml-2">EdgeGPT</h2>
        )}
      </div>
      
      <div className="px-3 py-4 flex-grow overflow-y-auto pb-16">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                location.pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "transparent"
              )}
            >
              <item.icon className="h-4 w-4" />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Account Profile Box - fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t bg-background pt-2 px-2 pb-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/avatars/01.png" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          
          {!isCollapsed ? (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate">John Doe</span>
              <span className="text-xs text-muted-foreground truncate">john@example.com</span>
              <div className="flex gap-1 mt-1">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                  <Link to="/profile">Profile</Link>
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={handleLogout}>
                  <Icons.logOut className="h-3 w-3 mr-1" />
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Icons.menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">John Doe</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      john@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer w-full">
                    <Icons.user className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer w-full">
                    <Icons.settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <Icons.logOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
