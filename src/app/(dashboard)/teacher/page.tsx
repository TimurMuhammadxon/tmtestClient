import ProtectedRoute from "@/components/ProtectedRoute";

export default function TeacherPage() {
  return (
    <ProtectedRoute allowedRoles={["teacher", "admin", "superadmin", "owner"]}>
      <h1>Страница преподавателя</h1>
      {/* тут контент */}
    </ProtectedRoute>
  );
}
