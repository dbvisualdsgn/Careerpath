import { brandIcons } from './brandIcons';
import type { CVData, Education, Experience, Certification, Language, Tool } from './types';

export const newId = () => Math.random().toString(36).slice(2, 10);

export const sampleCV: CVData = {
  version: 1,
  profile: {
    name: 'Daniele Brusca',
    headline: 'Senior Product Designer',
    email: 'dbvisualdesign@gmail.com',
    phone: '',
    location: '',
    website: 'danielebrusca.com',
    linkedin: '',
  },
  summary:
    'Senior Product Designer specialized in product design, design systems and brand identity, building scalable, user-centric interfaces for SaaS and developer tools. Started as an Art Director in 2013 and now designs product features at GitGuardian. Motivated by startups and innovation that bring a positive impact and inclusivity.',
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
    { id: 't1', name: 'Figma', description: 'Collaborative interface design tool', icon: brandIcons.figma },
    { id: 't2', name: 'Adobe Creative Suite', description: 'Photoshop, Illustrator, XD', icon: brandIcons.adobe },
    { id: 't3', name: 'Jitter', description: 'Motion design tool' },
    { id: 't4', name: 'ChatGPT', description: 'AI assistant', icon: brandIcons.chatgpt },
    { id: 't5', name: 'Midjourney', description: 'AI image generation', icon: brandIcons.midjourney },
    { id: 't6', name: 'Linear', description: 'Project management', icon: brandIcons.linear },
    { id: 't7', name: 'Notion', description: 'Documentation & notes', icon: brandIcons.notion },
    { id: 't8', name: 'Productboard', description: 'Product management', icon: brandIcons.productboard },
    { id: 't9', name: 'Hotjar', description: 'Behavior analytics', icon: brandIcons.hotjar },
  ],
  experience: [
    {
      id: 'e1',
      title: 'Product & Brand Designer',
      company: 'GitGuardian',
      location: 'Paris, France (Remote)',
      employmentType: 'Full-time',
      start: '2023',
      end: 'Present',
      bullets: [
        'Lead product design for a secrets security platform.',
        'Design intuitive interfaces that help developers detect exposed API keys.',
      ],
    },
    {
      id: 'e2',
      title: 'Brand & UX/UI Designer',
      company: 'Strapi',
      location: 'Paris, France (Remote)',
      employmentType: 'Full-time',
      start: '2022',
      end: '2023',
      bullets: [
        'Designed the brand identity of the leading open-source headless CMS.',
        'Designed the product UX that helps developers build APIs fast.',
      ],
      logo: brandIcons.strapi,
    },
    {
      id: 'e3',
      title: 'Designer',
      company: 'DB Visual Design',
      location: 'Rennes, France (Remote)',
      employmentType: 'Freelance',
      start: '2016',
      end: 'Present',
      bullets: [
        'Provide brand identity and UX/UI design for startups across various industries.',
      ],
    },
    {
      id: 'e4',
      title: 'Senior Graphic Designer',
      company: 'Mosaico Studio',
      location: 'Rome, Italy',
      employmentType: 'Freelance',
      start: '',
      end: '',
      bullets: [
        'Created visual designs and brand materials for diverse clients across print and digital media.',
      ],
    },
  ],
  education: [],
  certifications: [
    { id: 'c1', title: 'Accessibility for UX Design', description: 'WCAG 2.2 criteria', issuer: 'Udemy', year: '' },
    { id: 'c2', title: 'Product Design', description: 'UX Research & Methodologies', issuer: 'Udemy', year: '' },
    { id: 'c3', title: 'UI/UX Design', description: 'Advanced Prototyping', issuer: 'Udemy', year: '' },
    { id: 'c4', title: 'Graphic & Visual Design', description: '', issuer: 'AANT Academy', year: '' },
  ],
  languages: [],
};

export const blankCV: CVData = {
  version: 1,
  profile: { name: 'Your Name', headline: 'Your Job Title', email: '', phone: '', location: '', website: '', linkedin: '' },
  summary: '',
  skills: [],
  tools: [],
  experience: [],
  education: [],
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
