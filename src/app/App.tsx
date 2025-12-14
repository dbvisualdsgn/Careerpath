import { motion } from 'motion/react';
import { Mail, Figma, Palette, Zap, Trello, FileText, Database, MousePointer, Sparkles, Share2, Download, Printer, Target } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { Toaster, toast } from 'sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { ToolBadge } from './components/ToolBadge';
import { ExperienceCard } from './components/ExperienceCard';
import { CertificationCard } from './components/CertificationCard';
import { ThemeToggle } from './components/ThemeToggle';
import { HeroBackground } from './components/HeroBackground';
import { Button } from './components/ui/button';

export default function App() {
  const tools = [
    { icon: Figma, name: 'Figma', description: 'Collaborative interface design tool' },
    { icon: Palette, name: 'Adobe Suite', description: 'Photoshop, Illustrator, XD' },
    { icon: Zap, name: 'Jitter', description: 'Motion design tool' },
    { icon: Sparkles, name: 'AI Tools', description: 'ChatGPT, Midjourney' },
    { icon: Trello, name: 'Linear', description: 'Project management' },
    { icon: FileText, name: 'Notion', description: 'Documentation & Notes' },
    { icon: Database, name: 'Productboard', description: 'Product management' },
    { icon: MousePointer, name: 'Hotjar', description: 'Behavior analytics' },
  ];

  const experiences = [
    {
      title: 'Product & Brand Designer',
      company: 'GitGuardian',
      location: 'Paris (Remote)',
      period: '2023 - Present',
      description: 'Leading product design for a secrets security platform. Creating intuitive interfaces to help developers detect exposed API keys.',
      companyIcon: '🔐'
    },
    {
      title: 'Brand & UX/UI Designer',
      company: 'Strapi',
      location: 'Paris (Remote)',
      period: '2022 - 2023',
      description: 'Designed the brand identity and UX for the leading open-source headless CMS. Empowering developers to build APIs fast.',
      companyIcon: '🚀'
    },
    {
      title: 'Designer (Freelance)',
      company: 'DB Visual Design',
      location: 'Rennes (Remote)',
      period: '2016 - Present',
      description: 'Independent design consultancy providing brand identity and UX/UI design for startups across various industries.',
      companyIcon: '🎨'
    },
    {
      title: 'Senior Graphic Designer',
      company: 'Mosaico Studio',
      location: 'Rome',
      period: 'Freelance',
      description: 'Created compelling visual designs and brand materials for diverse clients, focusing on print and digital media.',
      companyIcon: '🖼️'
    },
  ];

  const certifications = [
    { title: 'Accessibility for UX Design', description: 'WCAG 2.2 criteria', institution: 'Udemy' },
    { title: 'Product Design', description: 'UX Research & Methodologies', institution: 'Udemy' },
    { title: 'UI/UX Design', description: 'Advanced Prototyping', institution: 'Udemy' },
    { title: 'Graphic & Visual Design', institution: 'AANT Academy' },
  ];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Daniele Brusca - CV',
          text: 'Check out Daniele Brusca\'s CV',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleDownload = () => {
    window.print();
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 font-sans selection:bg-blue-500/20" style={{ fontFamily: "'Manrope', sans-serif" }}>
          <Toaster />
          
          {/* Print Styles to force light mode */}
          <style>{`
            @media print {
              @page { margin: 0; }
              body { 
                background: white !important; 
                color: black !important; 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .dark {
                color-scheme: light !important;
              }
              /* Hide interactive elements */
              header nav button, 
              header nav .theme-toggle,
              .no-print {
                display: none !important;
              }
              /* Ensure backgrounds print correctly */
              * {
                border-color: #e4e4e7 !important; /* zinc-200 */
              }
              .bg-zinc-100 { background-color: #f4f4f5 !important; }
              .text-zinc-500 { color: #71717a !important; }
              .text-zinc-600 { color: #52525b !important; }
              .text-zinc-900 { color: #18181b !important; }
              
              /* Reset dark mode overrides */
              .dark .bg-zinc-950 { background-color: white !important; }
              .dark .text-zinc-50 { color: black !important; }
              .dark .text-zinc-400 { color: #71717a !important; }
              .dark .border-zinc-800 { border-color: #e4e4e7 !important; }
            }
          `}</style>

          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
            <nav className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
              <div className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                DB.CV
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleShare}
                  className="hidden sm:flex gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <Share2 size={16} />
                  Share
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownload}
                  className="gap-2 text-xs h-9"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
                <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-2" />
                <ThemeToggle />
              </div>
            </nav>
          </header>

          <div className="relative">
            <HeroBackground />

            {/* Main Layout */}
            <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24">
                
                {/* Left Sidebar / Intro Column */}
                <div className="md:col-span-4 space-y-12">
                  
                  {/* Name Block */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <div>
                      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        Daniele Brusca
                      </h1>
                      <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
                        Senior Product Designer
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <a 
                        href="mailto:dbvisualdesign@gmail.com" 
                        className="flex items-center gap-2 hover:text-blue-500 transition-colors"
                      >
                        <Mail size={16} />
                        <span>dbvisualdesign@gmail.com</span>
                      </a>
                      <a 
                        href="https://danielebrusca.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-blue-500 transition-colors"
                      >
                        <GlobeIcon />
                        <span>danielebrusca.com</span>
                      </a>
                    </div>
                  </motion.div>

                  {/* Scope Section */}
                  <section>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Scope</h3>
                    <div className="prose prose-zinc dark:prose-invert text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      <p>
                        Specialized in Product Design, Design Systems, and Brand Identity. Focusing on building scalable, user-centric interfaces for SaaS and developer tools.
                      </p>
                    </div>
                  </section>

                  {/* About Section */}
                  <section>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>About</h3>
                    <div className="prose prose-zinc dark:prose-invert text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 space-y-4">
                      <p>
                        I'm Daniele, passionate about everything around design and UX.
                      </p>
                      <p>
                        I kicked off as an Art Director in 2013, and now I'm crafting some new product features at GitGuardian.
                      </p>
                      <p>
                        I truly believe in startups and every innovation bringing a positive impact and inclusivity.
                      </p>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Certifications</h3>
                    <div className="space-y-3">
                      {certifications.map((cert, index) => (
                        <CertificationCard
                          key={index}
                          {...cert}
                          index={index}
                        />
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Content Column */}
                <div className="md:col-span-8 space-y-16">
                  
                  {/* Tools Section (Moved Up) */}
                  <section>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      <Zap size={16} className="text-zinc-400" />
                      Stack & Tools
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tools.map((tool) => (
                        <ToolBadge
                          key={tool.name}
                          icon={tool.icon}
                          name={tool.name}
                          description={tool.description}
                        />
                      ))}
                    </div>
                  </section>

                  {/* Experience Section */}
                  <section>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-8 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      <BriefcaseIcon />
                      Experience
                    </h3>
                    <div className="space-y-4">
                      {experiences.map((exp, index) => (
                        <ExperienceCard
                          key={index}
                          {...exp}
                          index={index}
                        />
                      ))}
                    </div>
                  </section>

                </div>
              </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-200 dark:border-zinc-800 py-12 text-center no-print">
              <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-zinc-500 dark:text-zinc-500">
                <p>© {new Date().getFullYear()} Daniele Brusca. All rights reserved.</p>
                <div className="flex gap-6">
                   <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">Privacy</a>
                   <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">Contact</a>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      className="text-zinc-400"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
