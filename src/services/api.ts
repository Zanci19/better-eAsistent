const BASE_URL = 'https://www.easistent.com/m';

const DEFAULT_HEADERS = {
  'x-app-name': 'child',
  'x-client-version': '11101',
  'x-client-platform': 'android',
  app: 'new_mobile_app',
  'Content-Type': 'application/json',
};

export interface LoginRequest {
  username: string;
  password: string;
  supported_user_types: string[];
}

export interface AccessToken {
  expiration_date: string;
  token: string;
}

export interface LoginUser {
  freshPassword: null | string;
  id: number;
  language: string;
  name: string;
  type: string;
  username: string;
}

export interface LoginResponse {
  access_token: AccessToken;
  refresh_token: string;
  user: LoginUser;
}

export interface TimetableEvent {
  classroom: string;
  color: string;
  date: string;
  from: string;
  homework: string[];
  lesson: string;
  teachers: string[];
  title: string;
  title_short: string;
  to: string;
  type: string;
}

export interface TimetableResponse {
  events: TimetableEvent[];
}

export interface TimetableHour {
  from: string;
  metadata: Record<string, unknown> | unknown[];
  summary: string;
  to: string;
  type: string;
}

export interface ChildTimetable {
  date: string;
  hours: TimetableHour[];
}

export interface ChildResponse {
  age: number;
  age_level: string;
  avatar: string | null;
  did_try_plus: boolean;
  display_name: string;
  gender: string;
  id: number;
  language: string;
  notifications: unknown[];
  plus_enabled: boolean;
  short_name: string;
  student_id: number;
  timetable: ChildTimetable;
  trial: boolean;
  trial_ends: string;
  type: string;
}

export interface RefreshTokenResponse {
  access_token: AccessToken;
  refresh_token: string;
}

// ── Grades ────────────────────────────────────────────────────────────────────

export interface Grade {
  id: number;
  subject_id: number;
  subject_name: string;
  subject_shortname: string;
  teacher_name: string;
  date_created: string;
  grade: string;
  grade_value: number;
  description: string;
  type: string;
  is_final: boolean;
  period: string;
  note: string;
}

export interface GradesResponse {
  items: Grade[];
}

// ── Absences ──────────────────────────────────────────────────────────────────

export interface Absence {
  id: number;
  date: string;
  from: string;
  to: string;
  event_name: string;
  subject_name: string;
  is_excused: boolean;
  excused_at: string | null;
  type: string;
  note: string;
}

export interface AbsencesSummary {
  excused: number;
  unexcused: number;
  justified: number;
  total: number;
}

export interface AbsencesResponse {
  items: Absence[];
  summary: AbsencesSummary;
}

// ── Evaluations ───────────────────────────────────────────────────────────────

export interface Evaluation {
  id: number;
  subject_id: number;
  subject_name: string;
  subject_shortname: string;
  teacher_name: string;
  date: string;
  from: string;
  to: string;
  description: string;
  type: string;
  confirmed: boolean;
}

export interface EvaluationsResponse {
  items: Evaluation[];
}

// ── Homework ──────────────────────────────────────────────────────────────────

export interface HomeworkItem {
  id: number;
  date_created: string;
  date_expire: string;
  subject_name: string;
  subject_shortname: string;
  teacher_name: string;
  description: string;
  done: boolean;
  class_name: string;
}

export interface HomeworkResponse {
  items: HomeworkItem[];
}

function authHeaders(token: string): Record<string, string> {
  return {
    ...DEFAULT_HEADERS,
    authorization: `Bearer ${token}`,
  };
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const body: LoginRequest = {
    username,
    password,
    supported_user_types: ['parent', 'child'],
  };

  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Napaka pri prijavi (${response.status})`);
  }

  return response.json() as Promise<LoginResponse>;
}

export async function refreshToken(
  refreshTokenValue: string,
  sessionToken: string,
): Promise<RefreshTokenResponse> {
  const response = await fetch(`${BASE_URL}/refresh_token`, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      cookie: `easistent_session=${sessionToken}`,
    },
    body: JSON.stringify({ refresh_token: refreshTokenValue }),
  });

  if (!response.ok) {
    throw new Error(`Napaka pri osvežitvi žetona (${response.status})`);
  }

  return response.json() as Promise<RefreshTokenResponse>;
}

export async function getTimetable(
  token: string,
  from: string,
  to: string,
): Promise<TimetableResponse> {
  const url = `${BASE_URL}/timetable/events?from=${from}&to=${to}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Napaka pri pridobivanju urnika (${response.status})`);
  }

  return response.json() as Promise<TimetableResponse>;
}

export async function getChild(token: string): Promise<ChildResponse> {
  const response = await fetch(`${BASE_URL}/me/child`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Napaka pri pridobivanju podatkov učenca (${response.status})`);
  }

  return response.json() as Promise<ChildResponse>;
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getWeekBounds(date: Date): { from: Date; to: Date } {
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  return { from: monday, to: friday };
}

const SLOVENIAN_DAYS: Record<string, string> = {
  Mon: 'Ponedeljek',
  Tue: 'Torek',
  Wed: 'Sreda',
  Thu: 'Četrtek',
  Fri: 'Petek',
  Sat: 'Sobota',
  Sun: 'Nedelja',
};

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });
}

export function formatSlovenianDay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const shortDay = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
  const dayName = SLOVENIAN_DAYS[shortDay] ?? shortDay;
  const d = String(day).padStart(2, '0');
  const m = String(month).padStart(2, '0');
  return `${dayName}, ${d}. ${m}.`;
}

export async function getGrades(token: string): Promise<GradesResponse> {
  const response = await fetch(`${BASE_URL}/grades`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Napaka pri pridobivanju ocen (${response.status})`);
  }

  return response.json() as Promise<GradesResponse>;
}

export async function getAbsences(token: string): Promise<AbsencesResponse> {
  const response = await fetch(`${BASE_URL}/absences`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Napaka pri pridobivanju izostankov (${response.status})`);
  }

  return response.json() as Promise<AbsencesResponse>;
}

export async function getEvaluations(
  token: string,
  filter: 'future' | 'past',
): Promise<EvaluationsResponse> {
  const response = await fetch(`${BASE_URL}/evaluations?filter=${filter}`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Napaka pri pridobivanju ocenjevanj (${response.status})`);
  }

  return response.json() as Promise<EvaluationsResponse>;
}

export async function getHomework(token: string): Promise<HomeworkResponse> {
  const response = await fetch(`${BASE_URL}/homework`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Napaka pri pridobivanju domačih nalog (${response.status})`);
  }

  return response.json() as Promise<HomeworkResponse>;
}

export function gradeColor(value: number): string {
  if (value >= 5) return 'success';
  if (value >= 4) return 'primary';
  if (value >= 3) return 'warning';
  if (value >= 2) return 'tertiary';
  return 'danger';
}

export function gradeLabel(value: number): string {
  switch (value) {
    case 5: return 'Odlično';
    case 4: return 'Prav dobro';
    case 3: return 'Dobro';
    case 2: return 'Zadostno';
    case 1: return 'Nezadostno';
    default: return String(value);
  }
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${String(day).padStart(2, '0')}. ${String(month).padStart(2, '0')}. ${year}`;
}

export function daysUntil(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = Date.UTC(year, month - 1, day);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}
