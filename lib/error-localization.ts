import type { Dictionary } from '@/get-dictionary';

const ERROR_MESSAGE_TO_KEY = {
  'Too many failed login attempts. Please try again later.':
    'tooManyLoginAttempts',
  'Account is temporarily locked due to too many failed attempts':
    'accountTemporarilyLocked',
  'Invalid email or password': 'invalidEmailOrPassword',
  'Email not confirmed. Please confirm your email before logging in.':
    'emailNotConfirmedLogin',
  'Your account has been banned. Please contact support.': 'accountBanned',
  'Too many 2FA attempts. Please try again later.': 'tooMany2FAAttempts',
  'Invalid 2FA code': 'invalid2FACode',
  'Invalid or expired temp token': 'invalidOrExpiredTempToken',
  'Invalid token type': 'invalidTokenType',
  '2FA not enabled': 'twoFANotEnabled',
  'No 2FA setup in progress': 'no2FASetupInProgress',
  '2FA already enabled': 'twoFAAlreadyEnabled',
  'OAuth code is required': 'oauthCodeRequired',
  'OAuth code is invalid or expired': 'oauthCodeInvalidOrExpired',
  'You cannot ban yourself': 'cannotBanYourself',
  'You cannot unban yourself': 'cannotUnbanYourself',
  'User is already banned': 'userAlreadyBanned',
  'User is not banned': 'userNotBanned',
  'Admin not found': 'adminNotFound',
  'User not found': 'userNotFound',
  'The specified user could not be found': 'userNotFound',
  'Your user profile could not be found': 'userProfileNotFound',
  'Your user profile could not be retrieved': 'userProfileNotFound',
  'Invalid or expired token': 'invalidOrExpiredToken',
  'An error occurred while updating your profile': 'profileUpdateFailed',
  'An error occurred while deleting your account': 'accountDeleteFailed',
  'You cannot change your own role': 'cannotChangeOwnRole',
  'Platform Admin cannot change Platform Owner role':
    'platformAdminCannotChangeOwnerRole',
  'Platform Admin cannot assign Platform Owner or Platform Admin roles':
    'platformAdminCannotAssignElevatedRoles',
  'Platform Admin cannot ban Platform Owner or Platform Admin':
    'platformAdminCannotBanPrivilegedUsers',
  'Platform Admin cannot unban Platform Owner or Platform Admin':
    'platformAdminCannotUnbanPrivilegedUsers',
  'Administrators cannot delete themselves': 'adminsCannotDeleteThemselves',
  'This username is already taken': 'usernameTaken',
  'This email is already registered': 'emailAlreadyRegistered',
  'Registration failed. Please try again.': 'registrationFailed',
  'Failed to submit application. Please try again.':
    'businessApplicationSubmitFailed',
  'You already have a pending business application':
    'businessApplicationPendingExists',
  'Business application not found': 'businessApplicationNotFound',
  'Application has already been reviewed': 'businessApplicationAlreadyReviewed',
  'Only platform administrators can view business applications':
    'onlyPlatformAdminsCanViewBusinessApplications',
  'Business not found': 'businessNotFound',
  'You do not have access to this business': 'noBusinessAccess',
  'Only business owners can modify business settings':
    'onlyBusinessOwnersCanModifySettings',
  'Only platform administrators can view all businesses':
    'onlyPlatformAdminsCanViewAllBusinesses',
  'User is already assigned to this business': 'userAlreadyAssignedToBusiness',
  'User is not assigned to this business': 'userNotAssignedToBusiness',
  'Cannot unassign business owner': 'cannotUnassignBusinessOwner',
  'Platform admins cannot delete platform owners':
    'platformAdminCannotDeleteOwner',
  'Admin accounts cannot be deleted via self-service':
    'adminAccountsCannotSelfDelete',
  'No update fields provided': 'noUpdateFieldsProvided',
} as const;

const ERROR_TYPE_TO_KEY = {
  USERNAME_TAKEN: 'usernameTaken',
  ACCOUNT_EXISTS: 'accountExists',
  EMAIL_NOT_CONFIRMED: 'emailNotConfirmedRegister',
} as const;

type ErrorMessageKey = keyof typeof ERROR_MESSAGE_TO_KEY;
type ErrorTypeKey = keyof typeof ERROR_TYPE_TO_KEY;

function extractErrorMessage(error: unknown): string | undefined {
  return error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : undefined;
}

function extractErrorType(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  if (!('type' in error)) return undefined;

  const type = (error as { type?: unknown }).type;
  return typeof type === 'string' ? type : undefined;
}

export function localizeErrorMessage(
  error: unknown,
  dictionary: Dictionary,
  fallback: string
): string {
  const errorType = extractErrorType(error);
  if (errorType) {
    const typeKey = ERROR_TYPE_TO_KEY[errorType as ErrorTypeKey];
    if (typeKey) {
      return dictionary.errorMessages[typeKey] ?? fallback;
    }
  }

  const message = extractErrorMessage(error);
  if (!message) return fallback;

  const messageKey = ERROR_MESSAGE_TO_KEY[message as ErrorMessageKey];
  if (messageKey) {
    return dictionary.errorMessages[messageKey] ?? fallback;
  }

  return message;
}

export function localizeAuthErrorMessage(
  error: unknown,
  dictionary: Dictionary,
  fallback: string
): string {
  return localizeErrorMessage(error, dictionary, fallback);
}
