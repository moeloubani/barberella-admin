'use client';

import { useSession } from 'next-auth/react';

interface UserAvatarProps {
  className?: string;
}

export default function UserAvatar({ className = "" }: UserAvatarProps) {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const initials = session.user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || session.user.email?.[0].toUpperCase() || '?';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {session.user.image ? (
        <img
          src={session.user.image}
          alt={session.user.name || 'User avatar'}
          className="h-10 w-10 rounded-full border-2 border-gray-200"
        />
      ) : (
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
          {initials}
        </div>
      )}
      <div className="hidden md:block">
        <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
        <p className="text-xs text-gray-500">{session.user.email}</p>
      </div>
    </div>
  );
}