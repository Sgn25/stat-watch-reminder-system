// Centralized constants for the application

export const PARAMETER_CATEGORIES = [
  'License',
  'Certificate', 
  'Permit',
  'Insurance',
  'Contracts',
  'Approval'
] as const;

export type ParameterCategory = typeof PARAMETER_CATEGORIES[number]; 