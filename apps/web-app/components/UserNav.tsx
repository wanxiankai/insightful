// apps/web-app/components/UserNav.tsx

"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { LogOut, User } from "lucide-react";
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
        <button className="flex h-8 w-8 items-center justify-center cursor-pointer rounded-full bg-gray-100 ring-2 ring-transparent ring-offset-2 transition-all hover:ring-blue-500 focus:outline-none focus:ring-blue-500">
          <Image
            src={user.image ?? `https://avatar.vercel.sh/${user.id}.png`}
            alt={user.name ?? "User avatar"}
            width={32}
            height={32}
            className="rounded-full"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full border-none outline-none" align="end">
        <DropdownMenuItem className="">
          <div className="w-full flex items-center justify-center gap-2">
            <User />
            <span className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="cursor-pointer"
        >
          <div className="w-full flex items-center justify-start gap-2">
            <LogOut />
            <span className="text-sm font-medium text-gray-900 truncate">登出</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
