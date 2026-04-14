import { z } from 'zod';

export const companySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  website: z.string().url().nullable(),
  sector: z.string(),
  interest_categories: z.array(z.string()),
  teen_roles: z.array(z.string()),
  micro_experiment: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  distance_from_center: z.number().nullable(),
  funding_raised_usd: z.number().nullable(),
  funding_stage: z.string().nullable(),
  funding_date: z.string().nullable(),
  hiring_signal: z.boolean(),
  source: z.enum(['manual', 'southbay', 'tbpn']),
  source_ref: z.string().nullable(),
  is_active: z.boolean(),
});
export type Company = z.infer<typeof companySchema>;

const microExperimentSchema = z.object({
  title: z.string(),
  description: z.string(),
  location: z.string(),
  cost: z.string(),
  time_commitment: z.string(),
});

const matchedCompanySchema = z.object({
  company_id: z.string().uuid(),
  why_matched: z.string(),
});

const voiceSchema = z.object({
  pathway_name: z.string(),
  pathway_description: z.string(),
  salary_range: z.string(),
  time_to_entry: z.string(),
  matched_companies: z.array(matchedCompanySchema).min(1).max(5),
  micro_experiments: z.array(microExperimentSchema).min(1).max(5),
});

export const pathwaySchema = z.object({
  parent_voice: voiceSchema,
  teen_voice: voiceSchema,
});
export type Pathway = z.infer<typeof pathwaySchema>;
export type Voice = z.infer<typeof voiceSchema>;
export type MatchedCompany = z.infer<typeof matchedCompanySchema>;
export type MicroExperiment = z.infer<typeof microExperimentSchema>;

export const quizAnswersSchema = z.object({
  interest_category: z.string(),
  latent_skill: z.string(),
  work_style: z.string(),
  school_gap: z.string(),
  parent_vision: z.string(),
});
export type QuizAnswers = z.infer<typeof quizAnswersSchema>;
