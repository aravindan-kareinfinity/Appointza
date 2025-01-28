export class ActionRes<T> {
  item: T | null = null;
}
export enum ErrorCodes {
  BadRequest,
  DeleteRequestFailed,
  FileNotFound,
  UserNotFound,
  InvalidOtp,
  OtpAttemptsExceeded,
  IncorrectOtp,
  InvalidSession,
  SessionExpired,
  InvalidOrder,
  InvalidPayment,
  MobileNumberAlreadyExist,
  VendorNotApproved,
  SystemNotApproved,
  AccessDenied
}
