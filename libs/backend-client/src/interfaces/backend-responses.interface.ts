export interface AccountDeviceInfo {
  accountId: string;
  deviceId: string;
  [key: string]: unknown;
}

export interface LessonStatus {
  lessonId: string;
  status: string;
  [key: string]: unknown;
}
