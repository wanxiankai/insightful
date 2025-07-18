import Link from "next/link";
import UserNav from "@/components/UserNav";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface HeaderProps {
  showBackButton?: boolean;
}

export default function Header({ showBackButton = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full flex items-center justify-center border-b border-b-[#ebedf1] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-7xl flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {showBackButton ? (
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity min-h-[44px] min-w-[44px] -ml-2 pl-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium hidden sm:inline">返回</span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/insightful-logo-transparent.png" 
              alt="Insightful" 
              width={80} 
              height={60} 
              className="w-16 h-12 sm:w-20 sm:h-15 object-contain"
            />
          </Link>
        )}
        <div className="flex">
          <UserNav />
        </div>
      </div>
    </header>
  );
}