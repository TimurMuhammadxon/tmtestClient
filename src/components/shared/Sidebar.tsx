import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  CreditCard,
  Users,
  Link2,
  FileText,
  HelpCircle,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  GraduationCap,
  MessageSquare,
  ClipboardList,
  Banknote,
  UserCog,
  Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/api/auth";
import { t } from "@/lib/i18n";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: "/dashboard", icon: LayoutDashboard, label: t.dashboard },
  { to: "/progress", icon: TrendingUp, label: t.progress },
  { to: "/subscription", icon: CreditCard, label: t.subscription },
  { to: "/teacher-application", icon: ClipboardList, label: "O'qituvchi bo'lish" },
];

const teacherItems: NavItem[] = [
  { to: "/teacher/groups", icon: Users, label: t.groups, roles: ["Teacher", "Admin", "SuperAdmin", "Owner"] },
  { to: "/teacher/test-links", icon: Link2, label: t.testLinks, roles: ["Teacher", "Admin", "SuperAdmin", "Owner"] },
];

const adminItems: NavItem[] = [
  { to: "/admin/topics", icon: FileText, label: t.topics, roles: ["Admin", "SuperAdmin", "Owner"] },
  { to: "/admin/questions", icon: MessageSquare, label: "Savollar", roles: ["Admin", "SuperAdmin", "Owner"] },
  { to: "/admin/bilets", icon: BookOpen, label: "Biletlar", roles: ["Admin", "SuperAdmin", "Owner"] },
  { to: "/admin/applications", icon: HelpCircle, label: t.applications, roles: ["Admin", "SuperAdmin", "Owner"] },
  { to: "/admin/plans", icon: Settings, label: t.plans, roles: ["Admin", "SuperAdmin", "Owner"] },
  { to: "/admin/users", icon: UserCog, label: "Foydalanuvchilar", roles: ["Owner"] },
  { to: "/admin/payments", icon: Banknote, label: "To'lovlar", roles: ["Owner"] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobile, onClose }: SidebarProps) {
  const { user, clearAuth, refreshToken } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      clearAuth();
      navigate("/login");
    }
  };

  const isTeacher = user && ["Teacher", "Admin", "SuperAdmin", "Owner"].includes(user.role);
  const isAdmin = user && ["Admin", "SuperAdmin", "Owner"].includes(user.role);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-border h-full transition-all duration-300",
        mobile ? "w-72" : collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 h-16 border-b">
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm truncate">Haydovchi Test</span>
          </div>
        )}
        {!mobile && (
          <Button variant="ghost" size="icon" onClick={onToggle} className="flex-shrink-0">
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
        {mobile && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed && !mobile} onClose={onClose} />
        ))}

        {isTeacher && (
          <>
            <Separator className="my-2" />
            {(!collapsed || mobile) && (
              <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                O'qituvchi
              </p>
            )}
            {teacherItems.map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={collapsed && !mobile} onClose={onClose} />
            ))}
          </>
        )}

        {isAdmin && (
          <>
            <Separator className="my-2" />
            {(!collapsed || mobile) && (
              <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </p>
            )}
            {adminItems.filter(item => !item.roles || item.roles.includes(user?.role ?? "")).map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={collapsed && !mobile} onClose={onClose} />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t">
        <div className={cn("flex items-center gap-3", collapsed && !mobile && "justify-center")}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="flex-shrink-0 text-muted-foreground hover:text-destructive"
            title={t.logout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  collapsed,
  onClose,
}: {
  item: NavItem;
  collapsed: boolean;
  onClose?: () => void;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          collapsed && "justify-center px-2"
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}
