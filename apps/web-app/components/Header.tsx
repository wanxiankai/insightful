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
      <div className="w-[80%] flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {showBackButton ? (
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">返回</span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/insightful-logo-transparent.png" alt="Insightful" width={100} height={75} />
          </Link>
        )}
        <div className="flex">
          <UserNav />
        </div>
      </div>
    </header>
  );
}