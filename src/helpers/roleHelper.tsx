// src/utils/roleHelper.ts

export const getRoleName = (role: string | number | null | undefined): string => {
  switch (Number(role)) {
    case 0: return "Owner";
    case 1: return "SuperAdmin";
    case 2: return "Admin";
    case 3: return "Instructor";
    case 4: return "Student";
    default: return "Не определено";
  }
};