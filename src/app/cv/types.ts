export interface Profile {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  /** Square photo as a grayscale JPEG data URL. */
  photo?: string;
  /** What sits next to the name: nothing, the initials in a black square, or the photo. */
  avatar?: AvatarMode;
}

export type AvatarMode = 'none' | 'initials' | 'photo';

export interface Tool {
  id: string;
  name: string;
  description: string;
  /** Logo as a data URL (SVG or raster). Falls back to a monogram when empty. */
  icon?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  start: string;
  end: string;
  bullets: string[];
  logo?: string;
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  location: string;
  start: string;
  end: string;
  details: string;
}

export interface Certification {
  id: string;
  title: string;
  description: string;
  issuer: string;
  year: string;
}

export interface Language {
  id: string;
  name: string;
  level: string;
}

export interface CVData {
  version: 1;
  /** Private (default) keeps sharing off; public turns on share links. */
  isPublic?: boolean;
  profile: Profile;
  summary: string;
  skills: string[];
  tools: Tool[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  languages: Language[];
}

export type ListKey = 'tools' | 'experience' | 'education' | 'certifications' | 'languages';
