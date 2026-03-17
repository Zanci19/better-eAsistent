export type DateRange = { from: string; to: string };

export type ApiBundle = {
  grades: unknown;
  absences: unknown;
  homework: unknown;
  evaluations: unknown;
  schoolCatering: unknown;
  user: unknown;
};

const API_BASE = '/m';

const REQUIRED_HEADERS: Record<string, string> = {
  'x-app-name': 'child',
  'x-client-version': '11101',
  'x-client-platform': 'android',
  'app': 'new_mobile_app',
  'Content-Type': 'application/json',
};

const ensureAbsoluteUrl = (path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${API_BASE}/${path.replace(/^\/+/, '')}`;
};

const buildDateQuery = ({ from, to }: DateRange): string => {
  const params = new URLSearchParams({ from, to });
  return params.toString();
};

const getJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url, { headers: REQUIRED_HEADERS });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} (${url})`);
  }

  return response.json();
};

const fetchSchoolCatering = async (range: DateRange): Promise<unknown> => {
  const query = buildDateQuery(range);

  try {
    return await getJson(`${API_BASE}/school-catering?${query}`);
  } catch {
    return getJson(`${API_BASE}/school_catering?${query}`);
  }
};

export const fetchAllFromApi = async (range: DateRange): Promise<ApiBundle> => {
  const dateQuery = buildDateQuery(range);

  const [grades, absences, homework, evaluations, schoolCatering, user] = await Promise.all([
    getJson(`${API_BASE}/grades?${dateQuery}`),
    getJson(`${API_BASE}/absences?${dateQuery}`),
    getJson(`${API_BASE}/homework?${dateQuery}`),
    getJson(`${API_BASE}/evaluations?filter=future`),
    fetchSchoolCatering(range),
    getJson(`${API_BASE}/user`),
  ]);

  return { grades, absences, homework, evaluations, schoolCatering, user };
};

export const resolveAvatarUrl = (user: unknown): string | undefined => {
  if (!user || typeof user !== 'object') {
    return undefined;
  }

  const candidate = (
    user as {
      avatar?: string;
      avatarUrl?: string;
      profilePicture?: string;
      profile_picture?: string;
    }
  );

  const avatar = candidate.avatar ?? candidate.avatarUrl ?? candidate.profilePicture ?? candidate.profile_picture;

  if (!avatar || avatar.trim().length === 0) {
    return undefined;
  }

  return ensureAbsoluteUrl(avatar);
};
