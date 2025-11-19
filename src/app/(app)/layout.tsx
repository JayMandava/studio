'use client';
import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarInset, SidebarContent, SidebarFooter, SidebarTitle } from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, ShieldOff, Book, Puzzle } from 'lucide-react';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Image from "next/image";

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/requirements', label: 'Requirements', icon: FileText },
  { href: '/anonymization', label: 'Anonymization', icon: ShieldOff },
  { href: '/notebook', label: 'Notebook', icon: Book },
  { href: '/integrations', label: 'Integrations', icon: Puzzle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mobileTitle = (
    <VisuallyHidden>
        <SidebarTitle>Main Navigation</SidebarTitle>
    </VisuallyHidden>
  );

  return (
    <>
      <Sidebar title={mobileTitle}>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
            {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                        <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mt-auto">
          <div className="flex items-end justify-center pb-4 pt-2">
            <Image
              src="/nasscom.png"
              alt="Nasscom"
              width={120}
              height={120}
              className="h-auto w-24 opacity-90"
            />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
