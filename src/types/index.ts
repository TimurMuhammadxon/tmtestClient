export type Role = "Owner" | "SuperAdmin" | "Admin" | "Teacher" | "Student";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterResponse {
  id: string;
  email: string;
  role: Role;
}

// Subscription Plans
export interface SubscriptionPlanDto {
  id: string;
  type: string;
  duration: string;
  price: number;
  isActive: boolean;
}

export interface MySubscriptionDto {
  subscriptionId: string;
  planType: string;
  planDuration: string;
  planPrice: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  isTrial: boolean;
}

// Payment
export interface InitiatePaymentRequest {
  planId: string;
}

export interface InitiatePaymentResponse {
  orderId: string;
  checkoutUrl: string;
}

// Bilets
export interface PublicBiletListItemDto {
  id: string;
  number: number;
  isDemo: boolean;
  questionCount: number;
}

export interface PublicBiletDetailsDto {
  id: string;
  number: number;
  isDemo: boolean;
  isActive: boolean;
  questions: PublicBiletQuestionDto[];
}

export interface PublicBiletQuestionDto {
  id: string;
  orderIndex: number;
  text: string;
  imageUrl?: string;
  answers: { id: string; text: string }[];
}

// Attempts
export type FlowType = 1 | 2 | 3 | 4 | 5;
export type AttemptStatus = "InProgress" | "Completed" | "Passed" | "Failed";

export interface AttemptAnswerDto {
  id: string;
  orderIndex: number;
  text: string;
  language: string;
  isFallback: boolean;
  isCorrect: boolean;
}

export interface AttemptQuestionDto {
  orderIndex: number;
  questionId: string;
  imageUrl?: string;
  text: string;
  language: string;
  isFallback: boolean;
  chosenAnswerId?: string;
  isCorrect?: boolean;
  answeredAt?: string;
  explanation?: string;
  answers: AttemptAnswerDto[];
}

export interface AttemptDto {
  id: string;
  flowType: string;
  status: AttemptStatus;
  startedAt: string;
  finishedAt?: string;
  correctCount?: number;
  totalQuestions: number;
  remainingSeconds?: number;
  showExplanations: boolean;
  questions: AttemptQuestionDto[];
}

export interface SubmitAnswerResult {
  isCorrect: boolean;
  correctAnswerId: string;
  isFinished: boolean;
  status: string;
  correctCount?: number;
  totalQuestions: number;
}

export interface FinishAttemptResult {
  status: AttemptStatus;
  correctCount: number;
  totalQuestions: number;
}

// Progress
export interface WeakTopicDto {
  topicId: string;
  topicName: string;
  totalAnswered: number;
  correctCount: number;
  accuracyPercent: number;
  grade: string;
}

export interface RecentAttemptDto {
  id: string;
  flow: string;
  status: AttemptStatus;
  correctCount?: number;
  totalQuestions: number;
  startedAt: string;
  finishedAt?: string;
}

export interface DailyActivityDto {
  date: string; // ISO date, e.g. "2026-08-18"
  answersCount: number;
  accuracyPercent: number;
}

export interface DashboardDto {
  currentStreak: number;
  longestStreak: number;
  level: string;
  totalCorrect: number;
  totalAnswered: number;
  accuracyPercent: number;
  examPassPrediction: number;
  weakTopics: WeakTopicDto[];
  recentAttempts: RecentAttemptDto[];
  weeklyActivity: DailyActivityDto[];
  totalQuestions: number;
  coveredQuestions: number;
  masteredQuestions: number;
}

export interface TopicProgressDto {
  topicId: string;
  topicName: string;
  totalAnswered: number;
  correctCount: number;
  accuracyPercent: number;
  grade: string;
  orderIndex: number;
}

export interface ErrorAnalysisItemDto {
  questionId: string;
  questionText: string;
  topicName: string;
  errorCount: number;
  errorRatePercent: number;
}

export interface ErrorQuestionDetailDto {
  questionId: string;
  questionText: string;
  imageUrl?: string;
  explanation?: string;
  topicName: string;
  answers: ErrorAnswerDto[];
  lastChosenAnswerId?: string;
}

export interface ErrorAnswerDto {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface AttemptHistoryItemDto {
  id: string;
  flow: string;
  status: AttemptStatus;
  correctCount?: number;
  totalQuestions: number;
  startedAt: string;
  finishedAt?: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// Groups
export interface GroupDto {
  id: string;
  name: string;
  inviteCode: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
}

export interface GroupMemberDto {
  userId: string;
  email: string;
  joinedAt: string;
}

// Test Links
export interface TestLinkDto {
  id: string;
  title: string;
  code: string;
  flowType: string;
  biletId?: string;
  topicIds?: string[];
  questionCount?: number;
  groupId?: string;
  maxAttempts: number;
  expiresAt: string;
  isActive: boolean;
  showExplanations: boolean;
  attemptsCount: number;
  createdAt: string;
}

export interface PublicTestLinkDto {
  id: string;
  title: string;
  flowType: string;
  maxAttempts: number;
  expiresAt: string;
  isActive: boolean;
  attemptsUsed: number;
}

export interface TestLinkResultItemDto {
  userId: string;
  firstName?: string;
  lastName?: string;
  attemptId: string;
  status: AttemptStatus;
  correctCount?: number;
  totalQuestions: number;
  finishedAt?: string;
}

export interface TestLinkResultsDto {
  testLinkId: string;
  title: string;
  results: TestLinkResultItemDto[];
}

// Teacher Applications
export interface TeacherApplicationDto {
  id: string;
  userId: string;
  email: string;
  status: "Pending" | "Approved" | "Rejected";
  rejectionReason?: string;
  createdAt: string;
}

// Admin
export interface AdminTopicDto {
  id: string;
  orderIndex: number;
  questionCount: number;
  name: string;
  language: string;
  isFallback: boolean;
}

export interface TranslationInput {
  language: string;
  name: string;
}

export interface AdminBiletDto {
  id: string;
  number: number;
  isActive: boolean;
  isDemo: boolean;
  questionCount: number;
}
