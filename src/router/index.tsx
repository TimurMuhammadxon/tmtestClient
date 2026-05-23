import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { DashboardPage } from "@/pages/student/DashboardPage";
import { BiletsPage } from "@/pages/student/BiletsPage";
import { AttemptPage } from "@/pages/student/AttemptPage";
import { ProgressPage } from "@/pages/student/ProgressPage";
import { SubscriptionPage } from "@/pages/student/SubscriptionPage";
import { GroupsPage } from "@/pages/teacher/GroupsPage";
import { TestLinksPage } from "@/pages/teacher/TestLinksPage";
import { TopicsPage } from "@/pages/admin/TopicsPage";
import { QuestionsPage } from "@/pages/admin/QuestionsPage";
import { BiletsPage as AdminBiletsPage } from "@/pages/admin/BiletsPage";
import { ApplicationsPage } from "@/pages/admin/ApplicationsPage";
import { PlansPage } from "@/pages/admin/PlansPage";
import { TeacherApplicationPage } from "@/pages/student/TeacherApplicationPage";
import { TestLinkPublicPage } from "@/pages/public/TestLinkPublicPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/t/:code",
    element: <TestLinkPublicPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/bilets", element: <BiletsPage /> },
      { path: "/attempts/:id", element: <AttemptPage /> },
      { path: "/progress", element: <ProgressPage /> },
      { path: "/subscription", element: <SubscriptionPage /> },
      { path: "/teacher-application", element: <TeacherApplicationPage /> },
      {
        path: "/teacher/groups",
        element: (
          <ProtectedRoute roles={["Teacher", "Admin", "SuperAdmin", "Owner"]}>
            <GroupsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/teacher/test-links",
        element: (
          <ProtectedRoute roles={["Teacher", "Admin", "SuperAdmin", "Owner"]}>
            <TestLinksPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/topics",
        element: (
          <ProtectedRoute roles={["Admin", "SuperAdmin", "Owner"]}>
            <TopicsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/questions",
        element: (
          <ProtectedRoute roles={["Admin", "SuperAdmin", "Owner"]}>
            <QuestionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/bilets",
        element: (
          <ProtectedRoute roles={["Admin", "SuperAdmin", "Owner"]}>
            <AdminBiletsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/applications",
        element: (
          <ProtectedRoute roles={["Admin", "SuperAdmin", "Owner"]}>
            <ApplicationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/plans",
        element: (
          <ProtectedRoute roles={["Admin", "SuperAdmin", "Owner"]}>
            <PlansPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
