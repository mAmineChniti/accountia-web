export interface AuthCookieData {
  token: string;
  refreshToken: string;
  expires_at: string;
  expires_at_ts: number;
  refresh_expires_at: string;
  refresh_expires_at_ts: number;
}

export interface UserCookieData {
  userId: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  birthdate?: string;
  role: string;
  loginTime: string;
}
