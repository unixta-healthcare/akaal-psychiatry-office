/**
 * Specialty Content Type Definitions
 * For mental health services and conditions
 */

export interface SpecialtyService {
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription?: string;
  category?: string;
  keyPoints?: string[];
  secondaryPoints?: string[];
  icon?: string;
  order?: number;
  featured?: boolean;
}

export interface TreatmentApproach {
  name: string;
  abbreviation?: string;
  slug: string;
  shortDescription: string;
  fullDescription?: string;
  bestFor?: string[];
  whatToExpect?: string[];
  benefits?: string[];
  evidenceBased?: boolean;
  icon?: string;
  order?: number;
}

export interface PatientPopulation {
  name: string;
  slug?: string;
  description: string;
  ageRange?: string;
  specialConsiderations?: string[];
  icon?: string;
}

export interface InsuranceInfo {
  accepted: string[];
  outOfNetwork?: boolean;
  slidingScale?: boolean;
  notes?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export interface SpecialtyConfig {
  specialtyId: string;
  specialtyName: string;
  labels: {
    servicesTitle: string;
    servicesSingular: string;
    servicesPlural: string;
    approachesTitle: string;
    keyPointsLabel: string;
    secondaryPointsLabel: string;
  };
}
