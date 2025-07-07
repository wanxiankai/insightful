// apps/web-app/components/UserNav.tsx

"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserNav() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null; // 或者可以返回一个登录按钮
  }

  const { user } = session;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-2 ring-transparent ring-offset-2 transition-all hover:ring-blue-500 focus:outline-none focus:ring-blue-500">
          <Image
            src={user.image ?? `https://avatar.vercel.sh/${user.id}.png`}
            alt={user.name ?? "User avatar"}
            width={32}
            height={32}
            className="rounded-full"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.name}
          </p>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => signOut()}
          className="cursor-pointer"
        >
          <LogOut className="mr-2 h-5 w-5" aria-hidden="true" />
          <span>登出</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
