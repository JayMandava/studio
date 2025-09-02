'use client';
import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarInset, SidebarTrigger, SidebarContent, SidebarTitle } from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, ShieldOff, Menu, Book, Puzzle } from 'lucide-react';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <SidebarTrigger className="md:hidden">
              <Menu className="h-6 w-6"/>
            </SidebarTrigger>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
