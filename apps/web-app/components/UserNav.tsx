// apps/web-app/components/UserNav.tsx

"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { LogOut, Star, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";

export default function UserNav() {
  const { data: session } = useSession();

  if (!session?.user) {
    return <Skeleton className="h-[32px] w-[32px] rounded-full" />
  }

  const { user } = session;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center cursor-pointer rounded-full bg-gray-100 ring-2 ring-transparent ring-offset-2 transition-all hover:ring-blue-500 focus:outline-none focus:ring-blue-500 min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px]">
          <Image
            src={user.image ?? `https://avatar.vercel.sh/${user.id}.png`}
            alt={user.name ?? "User avatar"}
            width={32}
            height={32}
            className="rounded-full w-6 h-6 sm:w-8 sm:h-8"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 sm:w-64 border-none outline-none mr-2 sm:mr-0" align="end">
        <DropdownMenuItem className="p-3 sm:p-2">
          <div className="w-full flex items-center justify-start gap-3 sm:gap-2">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-3 sm:p-2">
          <div className="w-full flex items-center justify-start gap-3 sm:gap-2">
            <Star className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm font-medium text-gray-900 truncate">
              <a
                href="https://github.com/wanxiankai/insightful"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                给我一个Star
              </a>
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="cursor-pointer p-3 sm:p-2"
        >
          <div className="w-full flex items-center justify-start gap-3 sm:gap-2">
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm font-medium text-gray-900 truncate">登出</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
