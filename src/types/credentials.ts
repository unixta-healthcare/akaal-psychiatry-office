/**
 * Healthcare Provider Credentials Type Definitions
 * 
 * Designed to support various healthcare professionals including:
 * - Nurse Practitioners (NP, PMHNP)
 * - Physicians (MD, DO)
 * - Licensed Therapists (LCSW, LPC, LMFT)
 * - Psychologists (PhD, PsyD)
 */

export interface Education {
  degree: string;
  institution: string;
  location?: string;
  graduationYear: number;
  honors?: string[];
}

export interface BoardCertification {
  board: string;
  specialty: string;
  certificationNumber?: string;
  initialCertification: number;
  recertificationDate?: number;
  verificationUrl?: string;
}

export interface License {
  state: string;
  licenseType: string;
  licenseNumber: string;
  status: 'Active' | 'Inactive';
  expirationDate?: string;
  verificationUrl?: string;
}

export interface ProfessionalMembership {
  organization: string;
  membershipType?: string;
  since?: number;
}

export interface ClinicalExperience {
  role: string;
  institution: string;
  location?: string;
  description?: string;
  startYear?: number;
  endYear?: number | 'Present';
  highlights?: string[];
}

export interface ProviderProfile {
  // Basic Information
  firstName: string;
  lastName: string;
  credentials: string;
  pronouns?: string;
  
  // Professional Details
  title: string;
  specialty: string;
  subspecialties?: string[];
  
  // Practice Information
  practiceName?: string;
  npi?: string;
  
  // Languages
  languages: string[];
  
  // Education & Training
  education: Education[];
  clinicalExperience?: ClinicalExperience[];
  
  // Certifications & Licenses
  boardCertifications: BoardCertification[];
  licenses: License[];
  
  // Professional Affiliations
  memberships?: ProfessionalMembership[];
  
  // Content
  biography: string;
  personalStatement?: string;
  philosophy?: string;
  
  // Cultural Competency
  culturalFocus?: {
    communities: string[];
    description: string;
  };
  
  // Media
  headshotUrl: string;
  
  // Contact
  email?: string;
  phone?: string;
  linkedIn?: string;
  
  // Location
  location: {
    city: string;
    state: string;
    telehealth: boolean;
    inPerson?: boolean;
  };
}
