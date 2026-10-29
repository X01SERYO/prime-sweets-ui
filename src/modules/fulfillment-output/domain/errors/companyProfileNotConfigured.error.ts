export class CompanyProfileNotConfiguredError extends Error {
  readonly code = 'COMPANY_PROFILE_NOT_CONFIGURED';

  constructor() {
    super('COMPANY_PROFILE_NOT_CONFIGURED');
    this.name = 'CompanyProfileNotConfiguredError';
  }
}
