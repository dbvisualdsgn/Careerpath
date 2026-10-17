import { brandLogo, companyLogo } from './logos';
import type { CVData, Education, Experience, Certification, Language, Tool } from './types';

export const newId = () => Math.random().toString(36).slice(2, 10);

// Daniele Brusca's real CV, used as the sample. Never invent facts here: every gap that needs a real value
// is marked TODO(Daniele). With those values in, the sample should score 85+ (see atsCheck.ts for the weights).
export const sampleCV: CVData = {
  version: 1,
  profile: {
    name: 'Daniele Brusca',
    headline: 'Senior Product Designer',
    email: 'dbvisualdesign@gmail.com',
    phone: '', // TODO(Daniele): a phone number, if you want it public.
    location: 'Rennes, France',
    website: 'danielebrusca.com',
    linkedin: '', // TODO(Daniele): LinkedIn URL.
  },
  summary:
    'Senior Product Designer focused on design systems, accessibility and brand identity, building scalable, user-centric interfaces for SaaS and developer tools. Started as an Art Director in 2013 and now designs product features at GitGuardian. Drawn to startups whose products have a positive, inclusive impact.',
  skills: [
    'Product Design',
    'Design Systems',
    'Brand Identity',
    'UX/UI Design',
    'UX Research',
    'Prototyping',
    'Accessibility (WCAG 2.2)',
    'Visual Design',
  ],
  tools: [
    { id: 't1', name: 'Figma', description: 'Collaborative interface design tool', icon: brandLogo('figma') },
    { id: 't2', name: 'Adobe Creative Suite', description: 'Photoshop, Illustrator, XD', icon: brandLogo('adobe') },
    { id: 't3', name: 'Jitter', description: 'Motion design tool' },
    { id: 't4', name: 'ChatGPT', description: 'AI assistant', icon: brandLogo('chatgpt') },
    { id: 't5', name: 'Midjourney', description: 'AI image generation', icon: brandLogo('midjourney') },
    { id: 't6', name: 'Linear', description: 'Project management', icon: brandLogo('linear') },
    { id: 't7', name: 'Notion', description: 'Documentation & notes', icon: brandLogo('notion') },
    { id: 't8', name: 'Productboard', description: 'Product management', icon: brandLogo('productboard') },
    { id: 't9', name: 'Hotjar', description: 'Behavior analytics', icon: brandLogo('hotjar') },
  ],
  experience: [
    {
      id: 'e1',
      title: 'Product & Brand Designer',
      company: 'GitGuardian',
      location: 'Paris, France (Remote)',
      employmentType: 'Full-time',
      start: '2023', // TODO(Daniele): start month, e.g. 'Mar 2023'.
      end: 'Present',
      bullets: [
        // TODO(Daniele): open with your strongest result, with a real number (users, adoption, time saved…).
        'Lead product design for a secrets security platform.',
        'Design intuitive interfaces that help developers detect exposed API keys.',
        // TODO(Daniele): a third bullet (e.g. design system work, brand work), with a number if you have one.
      ],
      logo: companyLogo('gitguardian'),
    },
    {
      id: 'e2',
      title: 'Brand & UX/UI Designer',
      company: 'Strapi',
      location: 'Paris, France (Remote)',
      employmentType: 'Full-time',
      start: '2022', // TODO(Daniele): start and end months.
      end: '2023',
      bullets: [
        // TODO(Daniele): a real number for one of these (reach of the rebrand, pages or components shipped…).
        'Designed the brand identity of the leading open-source headless CMS.',
        'Designed the product UX that helps developers build APIs fast.',
      ],
      logo: brandLogo('strapi'),
    },
    {
      id: 'e3',
      title: 'Designer',
      company: 'DB Visual Design',
      location: 'Rennes, France (Remote)',
      employmentType: 'Freelance',
      start: '2016', // TODO(Daniele): start month.
      end: 'Present',
      bullets: [
        // TODO(Daniele): how many clients or projects, and one notable result.
        'Provide brand identity and UX/UI design for startups across various industries.',
      ],
    },
    {
      id: 'e4',
      title: 'Senior Graphic Designer',
      company: 'Mosaico Studio',
      location: 'Rome, Italy',
      employmentType: 'Freelance',
      start: '', // TODO(Daniele): start and end dates (month and year).
      end: '',
      bullets: [
        // TODO(Daniele): a second bullet with a number (clients, campaigns, awards…).
        'Created visual designs and brand materials for diverse clients across print and digital media.',
      ],
    },
  ],
  education: [
    // TODO(Daniele): years (and city) for AANT Academy.
    { id: 'ed1', degree: 'Graphic & Visual Design', school: 'AANT Academy', location: '', start: '', end: '', details: '' },
  ],
  // TODO(Daniele): the year of each certification.
  certifications: [
    { id: 'c1', title: 'Accessibility for UX Design', description: 'WCAG 2.2 criteria', issuer: 'Udemy', year: '' },
    { id: 'c2', title: 'Product Design', description: 'UX Research & Methodologies', issuer: 'Udemy', year: '' },
    { id: 'c3', title: 'UI/UX Design', description: 'Advanced Prototyping', issuer: 'Udemy', year: '' },
  ],
  languages: [
    { id: 'l1', name: 'Italian', level: 'Native' },
    { id: 'l2', name: 'English', level: 'Professional' },
    { id: 'l3', name: 'French', level: 'Professional' },
  ],
};

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
