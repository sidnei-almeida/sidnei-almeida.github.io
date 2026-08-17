export type ResumeEngagement = {
  client: string;
  role: string;
  project: string;
  achievements: string[];
};

export type ResumeExperience = {
  title: string;
  company: string;
  period: string;
  engagements: ResumeEngagement[];
};

export type ResumeProject = {
  title: string;
  category: string;
  description: string;
  stack: string[];
};

export type ResumeEducation = {
  degree: string;
  institution: string;
  period: string;
};

export type ResumeSkillGroup = {
  group: string;
  items: string[];
};

export type ResumeCertification = {
  issuer: string;
  name: string;
  /** Issue month, 1-12. Omitted when the credential carries no issue date. */
  month?: number;
  /** Issue year. Omitted when the credential carries no issue date. */
  year?: number;
  /** Credential ID as shown on the issuer's verification page. */
  credentialId?: string;
  /** Shown in the one-page ATS export; the web page lists every certification. */
  featured?: boolean;
};

/** Proficiency keys resolve to localized labels in locales/*.json under `resume.languageLevels`. */
export type ResumeLanguageLevel = 'native' | 'c2' | 'c1' | 'b2' | 'b1' | 'a2';

export type ResumeLanguage = {
  /** BCP-47 code, also used to look up the localized language name. */
  code: 'pt' | 'en' | 'es';
  level: ResumeLanguageLevel;
  /** Certification backing the level, when one exists. */
  credential?: string;
};

export const resume = {
  name: 'Sidnei Almeida',
  title: 'AI Engineer & Full-Stack Developer',
  subtitle: 'AI-Driven Solutions & Data Strategy',
  location: 'Caxias do Sul, RS',
  email: 'sidnei.almeida1806@gmail.com',
  website: 'sidnei-almeida.github.io',
  phone: '+55 (54) 99174-6969',

  summary:
    'AI Engineer and Full-Stack Developer building production machine learning systems end to end. Experience across computer vision (YOLOv8, U-Net, CNNs), deep learning (LSTM, GANs, Transformers) and LLM applications — RAG pipelines, AI agents and prompt engineering with LangChain and Hugging Face. Comfortable across the full data lifecycle: web scraping, ETL, SQL and NoSQL modelling, model training, and deployment with FastAPI, Docker and CI/CD on AWS and Google Cloud. IBM-certified in AI Engineering and Generative AI Engineering, currently taking an MBA in Data Science & AI at USP/ESALQ.',

  experience: [
    {
      title: 'Data Solutions Engineer & Full-Stack Developer',
      company: 'Independent Contractor',
      period: '2021 - Present',
      engagements: [
        {
          client: 'Outlier AI, AI Training & Model Evaluation Platform',
          role: 'AI Trainer / LLM Evaluator',
          project:
            'Supported AI model training by evaluating, annotating, and improving model responses across reasoning, factuality, and instruction-following tasks.',
          achievements: [
            'Evaluated AI responses for accuracy, clarity, safety, and instruction-following',
            'Compared model outputs and identified hallucinations, reasoning errors, and inconsistencies',
            'Provided structured annotations and RLHF feedback to improve LLM training data quality',
            'Rewrote and refined responses based on project guidelines',
          ],
        },
        {
          client: 'Slimo, HealthTech Startup',
          role: 'Data Engineer / Scientist',
          project:
            'Architected the complete data infrastructure for a nutritional tracking application (Mobile/Web).',
          achievements: [
            'Contributed to the development of a computer vision model for food segmentation and calorie estimation',
            'Designed and deployed the relational database (SQL) schema from scratch, ensuring 3NF normalization for user logs, nutritional tables, and biometric data',
            'Built ETL pipelines to scrape, clean, and ingest nutritional datasets',
            'Established data cleaning standards to support the calorie recommendation engine',
          ],
        },
      ],
    },
  ] satisfies ResumeExperience[],

  projects: [
    {
      title: 'DocMind | Intelligent Document Assistant',
      category: 'RAG / NLP',
      description:
        'Developed a Retrieval-Augmented Generation (RAG) system allowing users to query PDF documents using natural language.',
      stack: ['LangChain', 'OpenAI API', 'FAISS', 'FastAPI', 'Vanilla JS'],
    },
    {
      title: 'Industrial Anomaly Detection | Computer Vision & IoT',
      category: 'Computer Vision',
      description:
        'Built a "Black Piano" anomaly detection system for semiconductor manufacturing (SECOM) and a defect detection model for industrial bottling (MVTec AD).',
      stack: ['TensorFlow', 'PyTorch', 'U-Net', 'Autoencoders', 'OpenCV'],
    },
    {
      title: 'FluxForecast | Industrial Predictive Modeling',
      category: 'Time Series / Deep Learning',
      description:
        'Created a time-series forecasting system to predict liquid flow in pipeline systems, visualizing output via a real-time dashboard.',
      stack: ['Python', 'LSTM', 'TensorFlow', 'Plotly'],
    },
    {
      title: 'Advanced Computer Vision Suites',
      category: 'Computer Vision',
      description:
        'Deployed high-precision vision models including a License Plate Recognition system (99.69% precision) and Real-Time Emotion Analysis.',
      stack: ['YOLOv8', 'CNNs (VGG16)', 'Transfer Learning'],
    },
  ] satisfies ResumeProject[],

  education: [
    {
      degree: 'MBA, Data Science, Artificial Intelligence & Analytics',
      institution: 'University of São Paulo (USP / ESALQ)',
      period: 'Apr 2025 - Dec 2027',
    },
    {
      degree: 'Associate of Applied Science, Business Administration & Management',
      institution: 'Federal Institute of Rio Grande do Sul (IFRS), Caxias do Sul',
      period: 'Mar 2019 - Dec 2025',
    },
  ] satisfies ResumeEducation[],

  languages: [
    { code: 'pt', level: 'native' },
    { code: 'en', level: 'c2', credential: 'EF SET C2 Proficient (2023)' },
    { code: 'es', level: 'b2' },
  ] satisfies ResumeLanguage[],

  skills: [
    {
      group: 'Data Science & AI',
      items: [
        'Python',
        'NumPy',
        'Pandas',
        'Scikit-Learn',
        'TensorFlow',
        'PyTorch',
        'Keras',
        'Deep Learning',
        'Computer Vision',
        'OpenCV',
        'YOLOv8',
        'CNNs',
        'U-Net',
        'LSTM',
        'GANs',
        'NLP',
        'Transformers',
        'BERT',
        'LLMs',
        'Generative AI',
        'RAG',
        'LangChain',
        'Hugging Face',
        'AI Agents',
        'Prompt Engineering',
        'RLHF',
        'Anomaly Detection',
        'Time Series Forecasting',
      ],
    },
    {
      group: 'Data Engineering',
      items: [
        'SQL',
        'PostgreSQL',
        'MongoDB',
        'NoSQL',
        'Vector Databases',
        'FAISS',
        'Database Design',
        'Schema Design',
        'Data Modeling',
        'ETL Pipelines',
        'Web Scraping',
        'Selenium',
        'Data Cleaning',
        'Data Annotation',
        'Apache Spark',
        'Hadoop',
        'Big Data',
        'Data Integration',
      ],
    },
    {
      group: 'Full-Stack Development',
      items: [
        'FastAPI',
        'JavaScript',
        'TypeScript',
        'React',
        'Next.js',
        'Node.js',
        'HTML5',
        'CSS',
        'Tailwind CSS',
        'REST APIs',
        'GraphQL',
        'JWT',
        'Authentication',
        'Streamlit',
        'Vite',
        'C++',
      ],
    },
    {
      group: 'Cloud, MLOps & DevOps',
      items: [
        'Docker',
        'Git',
        'GitHub Actions',
        'CI/CD',
        'AWS',
        'Google Cloud (GCP)',
        'Linux',
        'Model Deployment',
        'Real-Time Inference',
        'Model Monitoring',
      ],
    },
    {
      group: 'Analytics & Business',
      items: [
        'Power BI',
        'Tableau',
        'Plotly',
        'Matplotlib',
        'Seaborn',
        'Data Visualization',
        'Business Intelligence',
        'Business Analytics',
        'Predictive Modeling',
        'Statistical Analysis',
        'Regression Analysis',
        'Business Strategy',
        'Data-Driven Decision Making',
        'Agile Methodology',
        'Project Management',
      ],
    },
  ] satisfies ResumeSkillGroup[],

  /** Newest first. `featured` entries are the subset printed on the one-page ATS resume. */
  certifications: [
    {
      issuer: 'IBM',
      name: 'IBM Generative AI Engineering',
      credentialId: '1X8KW796YTBF',
      featured: true,
    },
    {
      issuer: 'IBM',
      name: 'IBM AI Engineering',
      month: 7,
      year: 2026,
      credentialId: 'DXSVKIUYZ3AU',
      featured: true,
    },
    {
      issuer: 'MongoDB',
      name: 'MongoDB Aggregation Framework',
      month: 6,
      year: 2026,
      credentialId: 'GN3NYBXC23YU',
      featured: true,
    },
    {
      issuer: 'MongoDB',
      name: 'Introduction to MongoDB',
      month: 6,
      year: 2026,
      credentialId: 'QS2MIL0U4TRO',
    },
    {
      issuer: 'University of Michigan',
      name: 'Python 3 Programming Specialization',
      month: 2,
      year: 2026,
      credentialId: 'J6YOEDGEY6TB',
    },
    {
      issuer: 'Google Cloud Skills Boost',
      name: 'Google Cloud Data Analytics',
      month: 11,
      year: 2025,
      credentialId: '38KINR4EXG22',
      featured: true,
    },
    {
      issuer: 'University of Colorado Boulder',
      name: 'Project Management Specialization',
      month: 10,
      year: 2025,
      credentialId: 'E9NRTBJBE6ZW',
    },
    {
      issuer: 'University of Colorado Boulder',
      name: 'Agile Project Management',
      month: 10,
      year: 2025,
      credentialId: '0KLBK65KXZ49',
    },
    {
      issuer: 'University of Pennsylvania (Wharton)',
      name: 'Business Analytics',
      month: 10,
      year: 2025,
      credentialId: '612KETI8J667',
    },
    {
      issuer: 'University of Virginia',
      name: 'Business Strategy Specialization',
      month: 10,
      year: 2025,
      credentialId: '34AD6LP5L9MG',
    },
    {
      issuer: 'Google',
      name: 'Google Data Analytics Professional Certificate',
      month: 10,
      year: 2025,
      credentialId: '9IQVTJKRMW9X',
      featured: true,
    },
    {
      issuer: 'IBM',
      name: 'IBM Data Science Professional Certificate',
      month: 9,
      year: 2025,
      credentialId: 'MCEPG0BKEUHN',
      featured: true,
    },
    {
      issuer: 'Johns Hopkins University',
      name: 'Foundational Mathematics for AI',
      month: 9,
      year: 2025,
      credentialId: 'CRS9EHGL6D43',
      featured: true,
    },
    {
      issuer: 'University of Michigan',
      name: 'Statistics with Python Specialization',
      month: 9,
      year: 2025,
      credentialId: 'KJPS8PNUHK0O',
      featured: true,
    },
    {
      issuer: 'University of Pittsburgh',
      name: 'Linear Algebra and Regression Fundamentals for Data Science',
      month: 9,
      year: 2025,
      credentialId: 'FKBK9PVQANT0',
    },
    {
      issuer: 'IBM',
      name: 'IBM Machine Learning Specialist — Associate',
      month: 3,
      year: 2025,
      credentialId: 'PWID-B0236900',
      featured: true,
    },
    {
      issuer: 'IBM',
      name: 'The AI Ladder: A Framework for Deploying AI in your Enterprise',
      month: 3,
      year: 2025,
    },
    {
      issuer: 'IBM',
      name: 'Applied Data Science with Python — Level 2',
      month: 1,
      year: 2025,
      credentialId: 'PWID-B0571500',
    },
    {
      issuer: 'IBM',
      name: 'Hadoop Foundations',
      month: 1,
      year: 2025,
      credentialId: 'PWID-B0173200',
    },
    {
      issuer: 'IBM',
      name: 'Data Fundamentals',
      month: 1,
      year: 2025,
      credentialId: 'PWID-B0246400',
    },
    {
      issuer: 'EF SET',
      name: 'C2 Proficient English Certificate',
      month: 12,
      year: 2023,
      featured: true,
    },
    {
      issuer: 'Flexxo — Centro de Capacitação em TI',
      name: 'C++ Programming',
    },
  ] satisfies ResumeCertification[],
} as const;

/** Subset printed on the one-page ATS export. */
export const featuredCertifications = resume.certifications.filter((cert) => cert.featured);
