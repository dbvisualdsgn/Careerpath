import type { CVData, Education, Experience, Certification, Language, Tool } from './types';

export const newId = () => Math.random().toString(36).slice(2, 10);

export const blankCV: CVData = {
  version: 1,
  profile: { name: '', headline: '', email: '', phone: '', location: '', website: '', linkedin: '' },
  summary: '',
  skills: [],
  tools: [],
  experience: [],
  education: [],
  // TODO(Daniele): the year of each certification.
  certifications: [],
  languages: [],
};

export const emptyItems = {
  tools: (): Tool => ({ id: newId(), name: '', description: '' }),
  experience: (): Experience => ({
    id: newId(), title: '', company: '', location: '', employmentType: '', start: '', end: '', bullets: [],
  }),
  education: (): Education => ({ id: newId(), degree: '', school: '', location: '', start: '', end: '', details: '' }),
  certifications: (): Certification => ({ id: newId(), title: '', description: '', issuer: '', year: '' }),
  languages: (): Language => ({ id: newId(), name: '', level: '' }),
};
