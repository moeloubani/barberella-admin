import { requireAuth } from '@/lib/auth-utils';
import UserAvatar from '@/components/auth/UserAvatar';
import SignOutButton from '@/components/auth/SignOutButton';
import Link from 'next/link';
import { Calendar, Users, BarChart3, Settings, PhoneCall, Scissors } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: BarChart3,
    },
    {
      href: '/dashboard/appointments',
      label: 'Appointments',
      icon: Calendar,
    },
    {
      href: '/dashboard/customers',
      label: 'Customers',
      icon: Users,
    },
    {
      href: '/dashboard/services',
      label: 'Services',
      icon: Scissors,
    },
    {
      href: '/dashboard/analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            Barberella Admin
          </Link>
        </div>
        <nav className="px-4 pb-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                {/* Empty space or breadcrumbs can go here */}
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-4">
                <UserAvatar />
                <SignOutButton className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors">
                  Sign Out
                </SignOutButton>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}