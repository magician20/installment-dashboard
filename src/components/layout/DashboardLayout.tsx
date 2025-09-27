import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  Calendar,
  FolderOpen,
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "navigation.overview", href: "/", icon: LayoutDashboard },
  { name: "navigation.categories", href: "/categories", icon: FolderOpen },
  { name: "navigation.products", href: "/products", icon: Package },
  { name: "navigation.customers", href: "/customers", icon: Users },
  { name: "navigation.orders", href: "/orders", icon: ShoppingCart },
  { name: "navigation.installments", href: "/installments", icon: Calendar },
  { name: "navigation.payments", href: "/payments", icon: CreditCard }
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 ltr:left-0 rtl:right-0 w-64 bg-sidebar">
        <div className="flex flex-col h-full">
          {/* Logo and Language Switcher */}
          <div className="flex items-center justify-between px-6 py-6">
            <h1 className="text-xl font-bold text-sidebar-foreground">
              {t('adminDashboard')}
            </h1>
            <LanguageSwitcher />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-muted hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 ltr:mr-3 rtl:ml-3" />
                  {t(item.name)}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-sidebar-accent/20">
            <div className="flex items-center mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-sidebar-foreground">
                  {user?.email || "User"}
                </p>
              </div>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t('common.signOut')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ltr:pl-64 rtl:pr-64">
        <div className="min-h-screen bg-content-background">
          {children}
        </div>
      </main>
    </div>
  );
}