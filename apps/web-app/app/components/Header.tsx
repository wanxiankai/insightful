// apps/web-app/src/components/Header.tsx

import { BrainCircuit } from "lucide-react";
import UserNav from "./UserNav";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <a href="/" className="mr-6 flex items-center space-x-2">
            <BrainCircuit className="h-6 w-6 text-blue-500" />
            <span className="font-bold text-red-300">Insightful</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <UserNav />
        </div>
      </div>
    </header>
  );
}