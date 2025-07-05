// apps/web-app/src/components/UserNav.tsx

"use client";

import { useSession, signOut } from "next-auth/react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Image from "next/image";
import { LogOut, User as UserIcon } from "lucide-react";

export default function UserNav() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null; // 或者可以返回一个登录按钮
  }

  const { user } = session;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-2 ring-transparent ring-offset-2 transition-all hover:ring-blue-500 focus:outline-none focus:ring-blue-500">
          <Image
            src={user.image ?? `https://avatar.vercel.sh/${user.id}.png`}
            alt={user.name ?? "User avatar"}
            width={32}
            height={32}
            className="rounded-full"
          />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1">
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => signOut()}
                  className={`${
                    active ? "bg-blue-500 text-white" : "text-gray-900"
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <LogOut className="mr-2 h-5 w-5" aria-hidden="true" />
                  登出
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
