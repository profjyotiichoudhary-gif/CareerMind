export interface SkillExtraction {
  technical_skills: string[];
  soft_skills: string[];
  experience_years: number;
  education: string;
  current_role: string | null;
}

export interface CareerRecommendation {
  role: string;
  match_score: number;
  description: string;
  required_skills: string[];
  companies: string[];
  avg_salary: string;
}

export interface SkillGap {
  missing_skills: string[];
  partial_skills: string[];
  strong_skills: string[];
  match_percentage: number;
  priority_to_learn: string[];
  estimated_gap_months: number;
}

export interface RoadmapItem {
  month: number;
  focus: string;
  skills: string[];
  milestones: string[];
  resources: string[];
  project_idea: string;
}

export interface InterviewQuestion {
  question: string;
  type: string;
  sample_answer: string;
}

export interface ResumeData {
  id: string;
  filename: string;
  raw_text: string;
  skills: string[];
  uploaded_at: string;
}
