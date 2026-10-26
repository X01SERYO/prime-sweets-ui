export class LoginResponseInvalidError extends Error {
  readonly code = 'LOGIN_RESPONSE_INVALID';

  constructor() {
    super('LOGIN_RESPONSE_INVALID');
    this.name = 'LoginResponseInvalidError';
  }
}
