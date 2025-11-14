// src/components/Sidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon, // A good icon for an "official" tool
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    fetchUser();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); // Redirect to login page
    router.refresh(); // Ensure the layout reloads
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'AI Chat', href: '/dashboard/chat', icon: ChatBubbleLeftRightIcon },
  ];

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white h-screen">
      {/* Header */}
      <div className="flex items-center justify-center h-16 border-b border-gray-700">
        <ShieldCheckIcon className="h-8 w-8 text-indigo-400" />
        <h1 className="text-xl font-bold ml-2">CivicSense AI</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium
              ${pathname === item.href
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
          >
            <item.icon className="h-6 w-6 mr-3" />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Footer (User & Logout) */}
      <div className="border-t border-gray-700 p-4">
        <p className="text-xs text-gray-400 truncate" title={userEmail || ''}>
          {userEmail || 'Loading user...'}
        </p>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2.5 mt-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <ArrowRightOnRectangleIcon className="h-6 w-6 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}