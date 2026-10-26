/** パスワードは半角英数字8文字以上（仕様書 2-2 のログイン・新規登録） */
export const PASSWORD_PATTERN = "[A-Za-z0-9]{8,}";
export const PASSWORD_MIN_LENGTH = 8;

/** ユーザー名は20文字以内（仕様書 2-2 の新規登録） */
export const USER_NAME_MAX_LENGTH = 20;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = new RegExp(`^${PASSWORD_PATTERN}$`);

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = SignInInput & {
  userName: string;
  passwordConfirm: string;
};

/** 入力欄ごとのエラーメッセージ（エラーがない欄は含まない） */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

function validateEmail(email: string): string | undefined {
  if (!email) return "メールアドレスを入力してください。";
  if (!EMAIL_REGEX.test(email))
    return "メールアドレスの形式が正しくありません。";
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password) return "パスワードを入力してください。";
  if (!PASSWORD_REGEX.test(password)) {
    return `パスワードは半角英数字${PASSWORD_MIN_LENGTH}文字以上で入力してください。`;
  }
  return undefined;
}

/** ログインフォームの入力値を検証する */
export function validateSignIn(input: SignInInput): FieldErrors<SignInInput> {
  const errors: FieldErrors<SignInInput> = {};
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  if (!input.password) errors.password = "パスワードを入力してください。";
  return errors;
}

/** 新規登録フォームの入力値を検証する */
export function validateSignUp(input: SignUpInput): FieldErrors<SignUpInput> {
  const errors: FieldErrors<SignUpInput> = {};

  if (!input.userName) {
    errors.userName = "ユーザー名を入力してください。";
  } else if (input.userName.length > USER_NAME_MAX_LENGTH) {
    errors.userName = `ユーザー名は${USER_NAME_MAX_LENGTH}文字以内で入力してください。`;
  }

  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;

  if (!input.passwordConfirm) {
    errors.passwordConfirm = "確認用のパスワードを入力してください。";
  } else if (input.password !== input.passwordConfirm) {
    errors.passwordConfirm = "パスワードが一致しません。";
  }

  return errors;
}
