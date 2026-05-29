import { NavLink, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Menu,
  LogOut,
  ClipboardList,
  FileText,
  MessageSquare,
  BookOpen,
  HelpCircle,
  Settings,
  Banknote,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/api/auth";
import { t } from "@/lib/i18n";

type IconType = React.ElementType | string;

interface NavItem {
  to: string;
  icon: IconType;
  label: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: "/dashboard",           icon: "/pravadrive-icon-umumiy.svg",      label: t.dashboard },
  { to: "/progress",            icon: "/pravadrive-icon-natijalarim.svg", label: t.progress },
  { to: "/subscription",        icon: "/pravadrive-icon-obuna.svg",       label: t.subscription },
  { to: "/teacher-application", icon: ClipboardList,                      label: "O'qituvchi bo'lish" },
];

const teacherItems: NavItem[] = [
  { to: "/teacher/groups",      icon: "/pravadrive-icon-guruhlar.svg",  label: t.groups },
  { to: "/teacher/test-links",  icon: "/pravadrive-icon-havolalar.svg", label: t.testLinks },
];

const adminItems: NavItem[] = [
  { to: "/admin/topics",       icon: FileText,      label: t.topics },
  { to: "/admin/questions",    icon: MessageSquare, label: "Savollar" },
  { to: "/admin/bilets",       icon: BookOpen,      label: "Biletlar" },
  { to: "/admin/applications", icon: HelpCircle,    label: t.applications },
  { to: "/admin/plans",        icon: Settings,      label: t.plans },
  { to: "/admin/users",        icon: UserCog,       label: "Foydalanuvchilar", roles: ["Owner"] },
  { to: "/admin/payments",     icon: Banknote,      label: "To'lovlar",        roles: ["Owner"] },
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
      style={{
        background: "linear-gradient(180deg, #0d0d16 0%, #0a0a12 100%)",
        borderRight: "1px solid rgba(0, 240, 255, 0.08)",
        fontFamily: "'Outfit', sans-serif",
      }}
      className={cn(
        "flex flex-col h-full transition-all duration-300",
        mobile ? "w-72" : collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div
        style={{ borderBottom: "1px solid rgba(0, 240, 255, 0.08)" }}
        className="flex items-center justify-between p-4 h-16"
      >
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/pravadrive-logo-horizontal.svg"
              alt="pravadrive"
              style={{ height: 36, width: "auto", maxWidth: 150 }}
            />
          </div>
        )}
        {collapsed && !mobile && (
          <img
            src="/pravadrive-symbol.svg"
            alt="pravadrive"
            style={{ height: 28, width: 28, margin: "0 auto" }}
          />
        )}
        {!mobile && (
          <button
            onClick={onToggle}
            style={{ color: "rgba(148, 163, 184, 0.6)" }}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
        {mobile && (
          <button
            onClick={onClose}
            style={{ color: "rgba(148, 163, 184, 0.6)" }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed && !mobile} onClose={onClose} />
        ))}

        {isTeacher && (
          <>
            <div style={{ borderTop: "1px solid rgba(0, 240, 255, 0.06)" }} className="my-2 mx-2" />
            {(!collapsed || mobile) && (
              <p
                style={{ color: "rgba(0, 240, 255, 0.4)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em" }}
                className="px-3 py-1 uppercase"
              >
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
            <div style={{ borderTop: "1px solid rgba(0, 240, 255, 0.06)" }} className="my-2 mx-2" />
            {(!collapsed || mobile) && (
              <p
                style={{ color: "rgba(139, 92, 246, 0.5)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em" }}
                className="px-3 py-1 uppercase"
              >
                Admin
              </p>
            )}
            {adminItems
              .filter((item) => !item.roles || item.roles.includes(user?.role ?? ""))
              .map((item) => (
                <SidebarLink key={item.to} item={item} collapsed={collapsed && !mobile} onClose={onClose} />
              ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(0, 240, 255, 0.08)" }} className="p-3">
        <div className={cn("flex items-center gap-3", collapsed && !mobile && "justify-center")}>
          <div
            style={{
              background: "linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(124, 58, 237, 0.15))",
              border: "1px solid rgba(0, 240, 255, 0.2)",
              color: "#00f0ff",
              fontSize: "11px",
              fontWeight: 700,
            }}
            className="h-8 w-8 flex-shrink-0 rounded-lg flex items-center justify-center"
          >
            {initials}
          </div>
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p style={{ color: "#e2e8f0", fontSize: "12px", fontWeight: 500 }} className="truncate">
                {user?.email}
              </p>
              <p style={{ color: "rgba(148, 163, 184, 0.5)", fontSize: "11px" }}>{user?.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={t.logout}
            style={{ color: "rgba(148, 163, 184, 0.4)" }}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
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
  const isImgIcon = typeof Icon === "string";

  return (
    <NavLink
      to={item.to}
      onClick={onClose}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
          isActive ? "sidebar-link-active" : "sidebar-link-inactive",
          collapsed && "justify-center px-2"
        )
      }
      style={({ isActive }) =>
        isActive
          ? {
              background: "linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(0, 240, 255, 0.05))",
              color: "#00f0ff",
              boxShadow: "inset 0 0 0 1px rgba(0, 240, 255, 0.2), 0 0 12px rgba(0, 240, 255, 0.05)",
            }
          : {
              color: "rgba(148, 163, 184, 0.7)",
            }
      }
    >
      {({ isActive }) => (
        <>
          {isImgIcon ? (
            <img
              src={Icon as string}
              alt=""
              className="h-4 w-4 flex-shrink-0 transition-all duration-200"
              style={{
                opacity: isActive ? 1 : 0.6,
                filter: isActive ? "drop-shadow(0 0 6px rgba(0, 240, 255, 0.6))" : "none",
              }}
            />
          ) : (
            <Icon
              className="h-4 w-4 flex-shrink-0 transition-all duration-200"
              style={isActive ? { filter: "drop-shadow(0 0 6px rgba(0, 240, 255, 0.6))" } : {}}
            />
          )}
          {!collapsed && (
            <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
          )}
        </>
      )}
    </NavLink>
  );
}
