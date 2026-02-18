import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Bell, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

/**
 * ProfileMenu Component
 * Displays user profile in the main navbar with dropdown menu
 * Shows user name, email, and quick actions
 */
export function ProfileMenu() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const userInitial = user.name?.charAt(0).toUpperCase() || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title={`${user.name} (${user.email})`}
        >
          <Avatar className="h-8 w-8 border">
            <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col min-w-0">
            <p className="text-sm font-medium truncate leading-none text-foreground">
              {user.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email || ''}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* User Info Header */}
        <div className="px-2 py-2 border-b border-border">
          <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>

        {/* Menu Items */}
        <DropdownMenuItem
          onClick={() => window.location.href = '/settings'}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => window.location.href = '/notification-preferences'}
          className="cursor-pointer"
        >
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => window.location.href = '/settings'}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={logout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
