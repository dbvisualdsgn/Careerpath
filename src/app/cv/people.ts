// Fictional example CVs for the public directory. Names, employers and contact details are invented;
// the page labels them as examples.
import { brandLogo } from './logos';
import type { AvatarMode, CVData, Experience, Tool } from './types';

export type Field =
  | 'health' | 'trades' | 'tech' | 'education' | 'hospitality' | 'finance'
  | 'logistics' | 'design' | 'sales' | 'law' | 'marketing' | 'support';

export interface Person {
  id: string;
  field: Field;
  cv: CVData;
  /** A portrait in public/people/, as a path from the site root. Loaded into the CV when it opens. */
  photo?: string;
}

let n = 0;
const uid = (p: string) => `${p}${++n}`;
const tool = (name: string, description: string, icon?: string): Tool => ({ id: uid('t'), name, description, icon });
const role = (title: string, company: string, location: string, start: string, end: string, bullets: string[], employmentType = 'Full-time', logo?: string): Experience => ({
  id: uid('e'), title, company, location, employmentType, start, end, bullets, logo,
});

function cv(p: {
  name: string; headline: string; location: string; summary: string; skills: string[]; tools: Tool[];
  experience: Experience[]; degree: string; school: string; years: [string, string]; languages: [string, string][];
  certs?: [string, string, string][];
  /** Next to the name: nothing (most), initials, or a photo. */
  avatar?: AvatarMode;
}): CVData {
  const handle = p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '.');
  return {
    version: 1,
    isPublic: true,
    profile: { name: p.name, headline: p.headline, email: `${handle}@example.com`, phone: '', location: p.location, website: '', linkedin: '', avatar: p.avatar ?? 'none' },
    summary: p.summary,
    skills: p.skills,
    tools: p.tools,
    experience: p.experience,
    education: [{ id: uid('ed'), degree: p.degree, school: p.school, location: '', start: p.years[0], end: p.years[1], details: '' }],
    certifications: (p.certs ?? []).map(([title, issuer, year]) => ({ id: uid('c'), title, description: '', issuer, year })),
    languages: p.languages.map(([name, level]) => ({ id: uid('l'), name, level })),
  };
}

// About 60% of the examples show nothing next to the name, 30% their initials and 10% a photo.
export const people: Person[] = [
  { id: 'amara-okafor', field: 'health', cv: cv({
    avatar: 'initials',
    name: 'Amara Okafor', headline: 'Registered Nurse, Emergency Care', location: 'Manchester, UK',
    summary: 'Registered nurse with 8 years in emergency and acute care. Calm under pressure, careful with handovers, and known for teaching new starters. Looking for a senior staff nurse role in a busy ED.',
    skills: ['Triage', 'Patient assessment', 'IV therapy', 'Wound care', 'Clinical handover', 'Mentoring'],
    tools: [tool('Microsoft Teams', 'Shift coordination', brandLogo('teams')), tool('Excel', 'Rota and audit tracking')],
    experience: [
      role('Staff Nurse, Emergency Department', 'Northside General Hospital', 'Manchester, UK', 'Mar 2019', 'Present', ['Triage 30+ patients per shift in a 60-bed emergency department.', 'Cut handover errors by 25% by introducing a structured SBAR checklist.', 'Mentored 12 newly qualified nurses through their preceptorship.']),
      role('Staff Nurse, Acute Medicine', 'Riverside NHS Trust', 'Leeds, UK', 'Sep 2016', 'Feb 2019', ['Cared for up to 8 acutely unwell patients per shift.', 'Led the ward\'s falls-prevention audit, reducing falls by 18% in a year.']),
    ],
    degree: 'BSc Adult Nursing', school: 'University of Leeds', years: ['2013', '2016'],
    languages: [['English', 'Native'], ['Igbo', 'Fluent']], certs: [['Advanced Life Support', 'Resuscitation Council UK', '2023']],
  }) },
  { id: 'lucas-ferreira', field: 'trades', cv: cv({
    name: 'Lucas Ferreira', headline: 'Licensed Electrician', location: 'Porto, Portugal',
    summary: 'Licensed electrician with 10 years of residential and commercial installs. Tidy, safe and on time. Moving into solar and EV-charger installation.',
    skills: ['Electrical installation', 'Fault finding', 'Solar PV', 'EV charging', 'Safety inspections', 'Blueprint reading'],
    tools: [tool('AutoCAD', 'Reading and marking up plans', brandLogo('autocad')), tool('Google Sheets', 'Quotes and job logs', brandLogo('sheets'))],
    experience: [
      role('Lead Electrician', 'Luz & Cabo Instalações', 'Porto, Portugal', 'Jan 2020', 'Present', ['Lead a team of 4 on 60+ residential and retail projects a year.', 'Installed 120 home EV chargers since 2022 with zero failed inspections.', 'Introduced digital job sheets, cutting invoicing time by 2 days per job.']),
      role('Electrician', 'Grupo Norte Obras', 'Braga, Portugal', 'Jun 2014', 'Dec 2019', ['Wired new-build apartment blocks of up to 80 units.', 'Trained 3 apprentices to licensed level.']),
    ],
    degree: 'Professional Certificate, Electrical Installations', school: 'Escola Profissional do Porto', years: ['2011', '2014'],
    languages: [['Portuguese', 'Native'], ['English', 'B2'], ['Spanish', 'B1']], certs: [['Solar PV Installer', 'DGEG', '2022']],
  }) },
  { id: 'mei-lin', field: 'tech', cv: cv({
    avatar: 'initials',
    name: 'Mei Lin', headline: 'Senior Software Engineer', location: 'Singapore',
    summary: 'Full-stack engineer with 9 years building payment and logistics products. Cares about simple code, good tests and kind code reviews.',
    skills: ['TypeScript', 'React', 'Node.js', 'System design', 'API design', 'Testing', 'Mentoring'],
    tools: [tool('TypeScript', 'Main language', brandLogo('typescript')), tool('React', 'Web apps', brandLogo('react')), tool('Docker', 'Local and CI environments', brandLogo('docker')), tool('GitHub', 'Code review and CI', brandLogo('github')), tool('PostgreSQL', 'Primary database', brandLogo('postgresql'))],
    experience: [
      role('Senior Software Engineer', 'Kite Payments', 'Singapore', 'Apr 2021', 'Present', ['Led the rewrite of the checkout API, cutting p95 latency from 900 ms to 220 ms.', 'Raised test coverage from 41% to 83% across 6 services.', 'Run a weekly code-review clinic for 15 engineers.']),
      role('Software Engineer', 'Harbourline Logistics', 'Singapore', 'Jul 2016', 'Mar 2021', ['Built the driver app used for 40,000 deliveries a day.', 'Shipped offline mode, reducing failed scans by 30%.']),
    ],
    degree: 'BComp Computer Science', school: 'National University of Singapore', years: ['2012', '2016'],
    languages: [['English', 'Native'], ['Mandarin', 'Native'], ['Japanese', 'B1']],
  }) },
  { id: 'giulia-romano', field: 'education', cv: cv({
    name: 'Giulia Romano', headline: 'Primary School Teacher', location: 'Bologna, Italy',
    summary: 'Primary teacher with 7 years in mixed-ability classes. Loves project-based learning, reading corners and parents\' evenings that actually help.',
    skills: ['Lesson planning', 'Project-based learning', 'Inclusive education', 'Classroom management', 'Parent communication'],
    tools: [tool('Google Classroom', 'Homework and class updates', brandLogo('classroom')), tool('Google Sheets', 'Progress tracking', brandLogo('sheets'))],
    experience: [
      role('Class Teacher, Years 3–5', 'Scuola Primaria G. Pascoli', 'Bologna, Italy', 'Sep 2019', 'Present', ['Teach a class of 24 pupils, including 4 with learning support plans.', 'Started a reading programme that lifted reading scores by 15% in two years.', 'Coordinate the school\'s outdoor-learning week for 300 pupils.']),
      role('Supply Teacher', 'Istituto Comprensivo 12', 'Bologna, Italy', 'Sep 2017', 'Jun 2019', ['Covered 9 classes across 3 schools.'], 'Part-time'),
    ],
    degree: 'Laurea in Scienze della Formazione Primaria', school: 'Università di Bologna', years: ['2012', '2017'],
    languages: [['Italian', 'Native'], ['English', 'C1']],
  }) },
  { id: 'tomas-herrera', field: 'hospitality', cv: cv({
    name: 'Tomás Herrera', headline: 'Chef de Partie', location: 'Madrid, Spain',
    summary: 'Chef de partie with 6 years in busy restaurant kitchens, strongest on the fish and sauce sections. Fast, clean and good with junior cooks.',
    skills: ['Fish and seafood', 'Sauces', 'Menu costing', 'Food safety (HACCP)', 'Stock control', 'Team training'],
    tools: [tool('Google Sheets', 'Prep lists and costings', brandLogo('sheets')), tool('Square', 'Point of sale', brandLogo('square'))],
    experience: [
      role('Chef de Partie, Fish', 'Mar Abierto', 'Madrid, Spain', 'May 2021', 'Present', ['Run the fish section for 180 covers a night.', 'Cut section food waste by 22% with new prep and portion standards.', 'Trained 5 commis chefs.']),
      role('Commis Chef', 'Casa Lumbre', 'Valencia, Spain', 'Sep 2018', 'Apr 2021', ['Worked all sections in a 90-cover restaurant.']),
    ],
    degree: 'Técnico Superior en Dirección de Cocina', school: 'Escuela de Hostelería de Valencia', years: ['2016', '2018'],
    languages: [['Spanish', 'Native'], ['English', 'B1']], certs: [['Food Safety Level 3 (HACCP)', 'Highfield', '2022']],
  }) },
  { id: 'fatima-el-idrissi', field: 'finance', cv: cv({
    name: 'Fatima Zahra El Idrissi', headline: 'Chartered Accountant', location: 'Lyon, France',
    summary: 'Chartered accountant with 8 years in audit and in-house finance. Turns messy month-ends into calm ones.',
    skills: ['Financial reporting', 'Month-end close', 'IFRS', 'Audit', 'Budgeting', 'Process improvement'],
    tools: [tool('SAP', 'ERP and ledger', brandLogo('sap')), tool('QuickBooks', 'SME clients', brandLogo('quickbooks')), tool('Excel', 'Models and reconciliations')],
    experience: [
      role('Finance Manager', 'Atelier Rhône Industries', 'Lyon, France', 'Feb 2021', 'Present', ['Shortened month-end close from 9 to 5 working days.', 'Own a €40M annual budget across 3 business units.', 'Led the SAP S/4HANA migration for finance.']),
      role('Senior Auditor', 'Cabinet Martel & Associés', 'Lyon, France', 'Sep 2016', 'Jan 2021', ['Led audits for 15 mid-size clients a year.']),
    ],
    degree: 'Diplôme d\'Expertise Comptable (DEC)', school: 'Université Lyon 3', years: ['2011', '2016'],
    languages: [['French', 'Native'], ['Arabic', 'Native'], ['English', 'C1']],
  }) },
  { id: 'jonas-becker', field: 'logistics', cv: cv({
    avatar: 'initials',
    name: 'Jonas Becker', headline: 'Logistics Coordinator', location: 'Hamburg, Germany',
    summary: 'Logistics coordinator with 6 years in port and warehouse operations. Good with numbers, drivers and last-minute changes.',
    skills: ['Freight planning', 'Inventory control', 'Customs paperwork', 'Route optimisation', 'Supplier communication'],
    tools: [tool('SAP', 'Warehouse management', brandLogo('sap')), tool('Excel', 'Planning and KPIs'), tool('Microsoft Teams', 'Team updates', brandLogo('teams'))],
    experience: [
      role('Logistics Coordinator', 'Elbhafen Spedition', 'Hamburg, Germany', 'Mar 2020', 'Present', ['Plan 250+ container moves a week across 3 terminals.', 'Raised on-time delivery from 89% to 97%.', 'Built a delay dashboard used by 40 colleagues.']),
      role('Warehouse Team Lead', 'Nordlager GmbH', 'Bremen, Germany', 'Aug 2017', 'Feb 2020', ['Led a shift of 12 pickers in a 20,000 m² warehouse.']),
    ],
    degree: 'Kaufmann für Spedition und Logistikdienstleistung', school: 'IHK Bremen', years: ['2014', '2017'],
    languages: [['German', 'Native'], ['English', 'C1'], ['Polish', 'A2']],
  }) },
  { id: 'priya-nair', field: 'tech', cv: cv({
    name: 'Priya Nair', headline: 'Data Analyst', location: 'Bengaluru, India',
    summary: 'Data analyst with 5 years turning messy data into clear decisions for retail and health teams. Strong in SQL, Python and plain-language reporting.',
    skills: ['SQL', 'Python', 'Data visualisation', 'A/B testing', 'Forecasting', 'Stakeholder reporting'],
    tools: [tool('Python', 'Analysis and automation', brandLogo('python')), tool('Tableau', 'Dashboards', brandLogo('tableau')), tool('PostgreSQL', 'Querying', brandLogo('postgresql')), tool('Excel', 'Quick analysis')],
    experience: [
      role('Data Analyst', 'Kirana Retail Labs', 'Bengaluru, India', 'Jun 2021', 'Present', ['Built the weekly sales dashboard used by 120 store managers.', 'Designed pricing tests that lifted basket size by 6%.', 'Automated 14 manual reports, saving 30 hours a month.']),
      role('Junior Analyst', 'CarePath Health', 'Chennai, India', 'Jul 2019', 'May 2021', ['Analysed appointment data to cut no-shows by 12%.']),
    ],
    degree: 'BSc Statistics', school: 'Christ University, Bengaluru', years: ['2016', '2019'],
    languages: [['English', 'Fluent'], ['Malayalam', 'Native'], ['Hindi', 'Fluent']], certs: [['Tableau Desktop Specialist', 'Tableau', '2022']],
  }) },
  { id: 'noah-van-dijk', field: 'trades', cv: cv({
    name: 'Noah van Dijk', headline: 'Carpenter & Joiner', location: 'Utrecht, Netherlands',
    summary: 'Carpenter with 12 years in renovation and custom joinery: kitchens, stairs and timber frames. Measures twice, explains clearly.',
    skills: ['Custom joinery', 'Timber framing', 'Kitchen fitting', 'Staircases', 'Site estimating', 'Restoration'],
    tools: [tool('SketchUp', 'Drawings for clients', brandLogo('sketchup')), tool('Google Sheets', 'Estimates', brandLogo('sheets'))],
    experience: [
      role('Carpenter (self-employed)', 'Van Dijk Houtwerk', 'Utrecht, Netherlands', '2018', 'Present', ['Completed 70+ renovation and joinery projects.', '4.9/5 average rating across 60 client reviews.', 'Restored oak staircases in 6 listed canal houses.'], 'Freelance'),
      role('Carpenter', 'Bouwbedrijf De Vecht', 'Utrecht, Netherlands', '2012', '2017', ['Built timber frames and roofs for 40 new homes.']),
    ],
    degree: 'MBO Timmerman (Level 3)', school: 'ROC Midden Nederland', years: ['2009', '2012'],
    languages: [['Dutch', 'Native'], ['English', 'C1'], ['German', 'B1']],
  }) },
  { id: 'sofia-andersson', field: 'design', cv: cv({
    name: 'Sofia Andersson', headline: 'UX Researcher', location: 'Stockholm, Sweden',
    summary: 'UX researcher with 6 years in public services and fintech. Turns interviews and data into decisions teams actually make.',
    skills: ['User interviews', 'Usability testing', 'Survey design', 'Journey mapping', 'Accessibility', 'Research ops'],
    tools: [tool('Figma', 'Prototypes for testing', brandLogo('figma')), tool('Miro', 'Synthesis workshops', brandLogo('miro')), tool('Notion', 'Research repository', brandLogo('notion'))],
    experience: [
      role('Senior UX Researcher', 'Krona Bank', 'Stockholm, Sweden', 'Jan 2022', 'Present', ['Ran 80+ interviews that reshaped onboarding, raising completion by 19%.', 'Set up a research repository now used by 9 product teams.']),
      role('UX Researcher', 'Digital Sweden Agency', 'Stockholm, Sweden', 'Sep 2018', 'Dec 2021', ['Led accessibility testing with 45 disabled users across 3 public services.']),
    ],
    degree: 'MSc Human-Computer Interaction', school: 'KTH Royal Institute of Technology', years: ['2016', '2018'],
    languages: [['Swedish', 'Native'], ['English', 'C2']],
  }) },
  { id: 'kwame-mensah', field: 'sales', cv: cv({
    name: 'Kwame Mensah', headline: 'Regional Sales Manager', location: 'Accra, Ghana',
    summary: 'Sales manager with 9 years in B2B solar and telecom across West Africa. Builds teams that sell honestly and keep customers.',
    skills: ['B2B sales', 'Team leadership', 'Pipeline management', 'Negotiation', 'Key accounts', 'Forecasting'],
    tools: [tool('Salesforce', 'CRM and forecasting', brandLogo('salesforce')), tool('HubSpot', 'Lead nurturing', brandLogo('hubspot')), tool('Excel', 'Territory planning')],
    experience: [
      role('Regional Sales Manager', 'SunGrid Africa', 'Accra, Ghana', 'Feb 2020', 'Present', ['Grew regional revenue from $2.1M to $5.4M in three years.', 'Lead 11 sales reps across Ghana and Togo.', 'Kept customer retention above 92%.']),
      role('Account Executive', 'WestTel Communications', 'Accra, Ghana', 'Mar 2015', 'Jan 2020', ['Closed 140 enterprise contracts worth $3M in total.']),
    ],
    degree: 'BSc Business Administration', school: 'University of Ghana', years: ['2010', '2014'],
    languages: [['English', 'Fluent'], ['Twi', 'Native'], ['French', 'B1']],
  }) },
  { id: 'elena-petrova', field: 'law', cv: cv({
    avatar: 'initials',
    name: 'Elena Petrova', headline: 'Corporate Counsel', location: 'Berlin, Germany',
    summary: 'Corporate lawyer with 8 years in tech and start-up law: contracts, data protection and funding rounds. Writes contracts people can read.',
    skills: ['Commercial contracts', 'GDPR', 'Corporate governance', 'Venture financing', 'Employment law', 'Negotiation'],
    tools: [tool('Word', 'Drafting and redlines'), tool('Notion', 'Contract playbooks', brandLogo('notion'))],
    experience: [
      role('Senior Corporate Counsel', 'Brightfield Mobility GmbH', 'Berlin, Germany', 'May 2021', 'Present', ['Advised on 3 funding rounds totalling €85M.', 'Cut contract turnaround from 12 to 4 days with standard templates.', 'Run the GDPR programme across 6 EU markets.']),
      role('Associate', 'Hartmann Lenz Rechtsanwälte', 'Berlin, Germany', 'Oct 2016', 'Apr 2021', ['Handled 200+ commercial contracts for tech clients.']),
    ],
    degree: 'LL.M. European Business Law', school: 'Humboldt University of Berlin', years: ['2014', '2016'],
    languages: [['Russian', 'Native'], ['German', 'C2'], ['English', 'C2']],
  }) },
  { id: 'diego-alvarez', field: 'marketing', cv: cv({
    name: 'Diego Álvarez', headline: 'Digital Marketing Specialist', location: 'Mexico City, Mexico',
    summary: 'Marketer with 5 years running paid social, email and content for consumer brands. Likes small tests, clear numbers and honest copy.',
    skills: ['Paid social', 'Email marketing', 'Content strategy', 'Analytics', 'A/B testing', 'Copywriting'],
    tools: [tool('Google Analytics', 'Reporting', brandLogo('googleanalytics')), tool('Meta Ads', 'Paid social', brandLogo('meta')), tool('Mailchimp', 'Email campaigns', brandLogo('mailchimp')), tool('Shopify', 'E-commerce', brandLogo('shopify'))],
    experience: [
      role('Digital Marketing Specialist', 'Café Raíz', 'Mexico City, Mexico', 'Jan 2022', 'Present', ['Grew online sales by 64% in 18 months.', 'Built an email list of 38,000 with a 41% open rate.', 'Cut cost per acquisition by 30% through creative testing.']),
      role('Marketing Assistant', 'Agencia Puente', 'Mexico City, Mexico', 'Jun 2019', 'Dec 2021', ['Managed social channels for 8 clients.']),
    ],
    degree: 'Licenciatura en Comunicación', school: 'UNAM', years: ['2015', '2019'],
    languages: [['Spanish', 'Native'], ['English', 'C1']], certs: [['Google Analytics Certification', 'Google', '2023']],
  }) },
  { id: 'hannah-schmidt', field: 'health', cv: cv({
    name: 'Hannah Schmidt', headline: 'Community Pharmacist', location: 'Vienna, Austria',
    summary: 'Pharmacist with 7 years in community pharmacy. Patient-first, precise with medicines and good at explaining them in plain words.',
    skills: ['Dispensing', 'Medication reviews', 'Vaccinations', 'Patient counselling', 'Inventory management', 'Team leadership'],
    tools: [tool('Excel', 'Stock and rota planning'), tool('Microsoft Teams', 'Pharmacy network', brandLogo('teams'))],
    experience: [
      role('Pharmacist in Charge', 'Apotheke am Ring', 'Vienna, Austria', 'Apr 2020', 'Present', ['Lead a team of 9 serving 400+ patients a day.', 'Launched in-pharmacy flu vaccination: 1,600 jabs in the first season.', 'Reduced stock write-offs by 20%.']),
      role('Pharmacist', 'Stadtapotheke Graz', 'Graz, Austria', 'Oct 2017', 'Mar 2020', ['Ran medication reviews for 300 elderly patients a year.']),
    ],
    degree: 'Mag. pharm. (Pharmacy)', school: 'University of Vienna', years: ['2012', '2017'],
    languages: [['German', 'Native'], ['English', 'C1'], ['Croatian', 'B2']],
  }) },
  { id: 'yuki-tanaka', field: 'design', cv: cv({
    name: 'Yuki Tanaka', headline: 'Architect', location: 'Osaka, Japan',
    summary: 'Licensed architect with 10 years designing housing and small public buildings in timber. Calm spaces, tight budgets, careful details.',
    skills: ['Architectural design', 'Timber construction', 'Planning permission', 'Detailing', 'Site supervision', 'Client presentations'],
    tools: [tool('AutoCAD', 'Drawings', brandLogo('autocad')), tool('Revit', 'BIM models', brandLogo('revit')), tool('Rhino', 'Form studies', brandLogo('rhino')), tool('SketchUp', 'Client models', brandLogo('sketchup'))],
    experience: [
      role('Project Architect', 'Kiso Atelier', 'Osaka, Japan', 'Apr 2018', 'Present', ['Delivered 14 timber housing projects, from 1 to 40 units.', 'Led a community library that won a regional design award in 2023.', 'Kept projects within 3% of budget on average.']),
      role('Architect', 'Yamamoto Sekkei', 'Kyoto, Japan', 'Apr 2014', 'Mar 2018', ['Detailed façades for 5 mid-rise residential buildings.']),
    ],
    degree: 'M.Arch', school: 'Kyoto Institute of Technology', years: ['2012', '2014'],
    languages: [['Japanese', 'Native'], ['English', 'B2']], certs: [['First-Class Registered Architect', 'MLIT Japan', '2017']],
  }) },
  { id: 'omar-haddad', field: 'support', cv: cv({
    avatar: 'initials',
    name: 'Omar Haddad', headline: 'Customer Support Team Lead', location: 'Dubai, UAE',
    summary: 'Support lead with 7 years in travel and SaaS. Builds teams that solve things on the first reply and write help articles people read.',
    skills: ['Customer support', 'Team leadership', 'Knowledge base', 'Escalation management', 'Quality assurance', 'Hiring'],
    tools: [tool('Zendesk', 'Ticketing', brandLogo('zendesk')), tool('Slack', 'Team chat', brandLogo('slack')), tool('Jira', 'Bug escalation', brandLogo('jira')), tool('Trello', 'Team boards', brandLogo('trello'))],
    experience: [
      role('Support Team Lead', 'Wayfare Travel Tech', 'Dubai, UAE', 'Jun 2021', 'Present', ['Lead 14 agents across 3 languages and time zones.', 'Raised first-contact resolution from 64% to 81%.', 'Wrote 120 help articles that cut ticket volume by 18%.']),
      role('Support Agent', 'Desert Sky Airlines', 'Dubai, UAE', 'Mar 2017', 'May 2021', ['Handled 60+ customer cases a day with a 96% satisfaction score.']),
    ],
    degree: 'BA English Literature', school: 'American University of Sharjah', years: ['2012', '2016'],
    languages: [['Arabic', 'Native'], ['English', 'C2'], ['French', 'B1']],
  }) },
  { id: 'chloe-martin', field: 'hospitality', cv: cv({
    name: 'Chloé Martin', headline: 'Barista & Student, Looking for a First Office Job', location: 'Montréal, Canada',
    summary: 'Final-year communications student with 3 years as a barista. Reliable, quick with people and comfortable with numbers. Looking for a junior coordinator role.',
    skills: ['Customer service', 'Cash handling', 'Scheduling', 'Social media', 'Event support', 'Bilingual communication'],
    tools: [tool('Square', 'Point of sale', brandLogo('square')), tool('Google Sheets', 'Shift schedules', brandLogo('sheets')), tool('Slack', 'Student association', brandLogo('slack'))],
    experience: [
      role('Barista, Shift Lead', 'Café Mile End', 'Montréal, Canada', 'Sep 2022', 'Present', ['Lead shifts of 4 serving 300+ customers a day.', 'Built the staff schedule, cutting last-minute gaps by half.'], 'Part-time'),
      role('Events Volunteer', 'Student Association, Concordia', 'Montréal, Canada', 'Sep 2023', 'Present', ['Helped run 10 events for up to 500 students.'], 'Volunteer'),
    ],
    degree: 'BA Communication Studies (expected 2026)', school: 'Concordia University', years: ['2022', '2026'],
    languages: [['French', 'Native'], ['English', 'C1'], ['Spanish', 'A2']],
  }) },
];

export const fields: Field[] = ['health', 'trades', 'tech', 'education', 'hospitality', 'finance', 'logistics', 'design', 'sales', 'law', 'marketing', 'support'];

export const findPerson = (id: string) => people.find((p) => p.id === id);
