export const t = {
  // Auth
  login: "Kirish",
  register: "Ro'yxatdan o'tish",
  logout: "Chiqish",
  email: "Elektron pochta",
  password: "Parol",
  confirmPassword: "Parolni tasdiqlash",
  forgotPassword: "Parolni unutdingizmi?",
  noAccount: "Akkauntingiz yo'qmi?",
  haveAccount: "Akkauntingiz bormi?",
  loginSuccess: "Muvaffaqiyatli kirdingiz",
  registerSuccess: "Muvaffaqiyatli ro'yxatdan o'tdingiz",

  // Navigation
  dashboard: "Bosh sahifa",
  bilets: "Biletlar",
  progress: "Natijalarim",
  subscription: "Obuna",
  groups: "Guruhlar",
  testLinks: "Test havolalari",
  adminPanel: "Admin panel",
  topics: "Mavzular",
  questions: "Savollar",
  applications: "Arizalar",
  plans: "Tariflar",

  // Dashboard
  currentStreak: "Joriy seriya",
  longestStreak: "Eng uzun seriya",
  level: "Daraja",
  accuracy: "To'g'rilik",
  examPrediction: "Imtihon bashorati",
  weakTopics: "Kuchsiz mavzular",
  recentAttempts: "So'nggi urinishlar",
  days: "kun",

  // Bilets
  bilet: "Bilet",
  startTest: "Testni boshlash",
  demo: "Demo",
  active: "Faol",
  inactive: "Nofaol",
  questions20: "20 savol",

  // Attempt / Test
  question: "Savol",
  of: "/",
  next: "Keyingisi",
  prev: "Oldingi",
  finish: "Yakunlash",
  timeLeft: "Qolgan vaqt",
  correct: "To'g'ri",
  incorrect: "Noto'g'ri",
  result: "Natija",
  passed: "O'tdi",
  failed: "O'tmadi",
  correctCount: "To'g'ri javoblar",
  totalQuestions: "Jami savollar",
  backToHome: "Bosh sahifaga",
  retake: "Qayta topshirish",

  // Flow types
  flowBilet: "Bilet",
  flowTopic: "Mavzu",
  flowCustom: "Ixtiyoriy",
  flowExam: "Imtihon",
  flowMarathon: "Marafon",

  // Progress
  topicsProgress: "Mavzular bo'yicha",
  errorsAnalysis: "Xatolar tahlili",
  history: "Tarix",
  grade: "Baho",
  notStudied: "O'rganilmagan",
  critical: "Kritik",
  needRepeat: "Takrorlash kerak",
  good: "Yaxshi",
  excellent: "A'lo",
  answered: "Javob berildi",

  // Subscription & Payments
  subscriptionPlans: "Obuna tariflari",
  mySubscription: "Mening obuna",
  noSubscription: "Obuna yo'q",
  expiresAt: "Muddati tugaydi",
  startsAt: "Boshlanadi",
  buySubscription: "Obuna olish",
  payViaPayme: "Payme orqali to'lash",
  payViaClick: "Click orqali to'lash",
  twoWeeks: "2 hafta",
  oneMonth: "1 oy",
  twoMonths: "2 oy",
  threeMonths: "3 oy",
  studentPlan: "O'quvchi tarifi",
  teacherPlan: "O'qituvchi tarifi",
  uzs: "so'm",

  // Groups
  createGroup: "Guruh yaratish",
  groupName: "Guruh nomi",
  inviteCode: "Taklif kodi",
  members: "A'zolar",
  addMember: "A'zo qo'shish",
  removeMember: "A'zoni chiqarish",
  deleteGroup: "Guruhni o'chirish",
  joinGroup: "Guruhga qo'shilish",
  enterInviteCode: "Taklif kodini kiriting",
  memberCount: "A'zolar soni",

  // Test Links
  createTestLink: "Test havolasi yaratish",
  title: "Sarlavha",
  maxAttempts: "Maksimal urinish",
  expiresAtLabel: "Amal qilish muddati",
  deactivate: "O'chirish",
  viewResults: "Natijalarni ko'rish",
  linkCode: "Havola kodi",
  copyLink: "Havolani nusxalash",
  copied: "Nusxalandi!",
  attempts: "Urinishlar",
  status: "Holat",

  // Teacher Applications
  applyTeacher: "O'qituvchi bo'lish uchun ariza",
  applicationStatus: "Ariza holati",
  pending: "Ko'rib chiqilmoqda",
  approved: "Tasdiqlandi",
  rejected: "Rad etildi",
  approve: "Tasdiqlash",
  reject: "Rad etish",
  rejectionReason: "Rad etish sababi",

  // Admin
  addTopic: "Mavzu qo'shish",
  editTopic: "Mavzuni tahrirlash",
  deleteTopic: "Mavzuni o'chirish",
  addQuestion: "Savol qo'shish",
  editQuestion: "Savolni tahrirlash",
  deleteQuestion: "Savolni o'chirish",
  orderIndex: "Tartib raqami",
  questionText: "Savol matni",
  answers: "Javoblar",
  isCorrect: "To'g'ri javob",
  grantSubscription: "Obuna berish",
  price: "Narx",
  toggleActive: "Faollashtirish/o'chirish",

  // Common
  save: "Saqlash",
  cancel: "Bekor qilish",
  delete: "O'chirish",
  edit: "Tahrirlash",
  add: "Qo'shish",
  search: "Qidirish",
  loading: "Yuklanmoqda...",
  error: "Xatolik",
  success: "Muvaffaqiyat",
  noData: "Ma'lumot yo'q",
  confirm: "Tasdiqlash",
  back: "Orqaga",
  close: "Yopish",
  actions: "Amallar",
  name: "Nomi",
  createdAt: "Yaratilgan",
  userId: "Foydalanuvchi",
  page: "Sahifa",
  total: "Jami",
};

export type FlowType = "Bilet" | "Topic" | "Custom" | "Exam" | "Marathon";

export function getFlowLabel(flow: string): string {
  switch (flow) {
    case "Bilet": return t.flowBilet;
    case "Topic": return t.flowTopic;
    case "Custom": return t.flowCustom;
    case "Exam": return t.flowExam;
    case "Marathon": return t.flowMarathon;
    default: return flow;
  }
}

export function getDurationLabel(duration: string): string {
  switch (duration) {
    case "TwoWeeks": return t.twoWeeks;
    case "OneMonth": return t.oneMonth;
    case "TwoMonths": return t.twoMonths;
    case "ThreeMonths": return t.threeMonths;
    default: return duration;
  }
}

export function getPlanTypeLabel(type: string): string {
  switch (type) {
    case "Student": return t.studentPlan;
    case "Teacher": return t.teacherPlan;
    default: return type;
  }
}
