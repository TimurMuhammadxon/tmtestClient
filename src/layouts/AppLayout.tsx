import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/shared/Sidebar";
import { Toaster } from "@/components/ui/toaster";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isAttempt = location.pathname.startsWith("/attempts/");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar — hidden during test */}
      {!isAttempt && (
        <div className="hidden md:flex flex-shrink-0">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {mobileOpen && !isAttempt && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar
              collapsed={false}
              onToggle={() => {}}
              mobile
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile header — hidden during test */}
        {!isAttempt && (
          <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b bg-background flex-shrink-0" style={{ borderColor: "rgba(0,240,255,0.08)" }}>
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <img src="/pravadrive-logo-horizontal.svg" alt="pravadrive" style={{ height: 30, width: "auto" }} />
          </header>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <Toaster />
    </div>
  );
}
