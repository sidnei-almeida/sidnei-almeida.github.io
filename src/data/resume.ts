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
  year: string;
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
    'Hands-on Developer specializing in the intersection of Data Engineering, Machine Learning, and Web Development. Experience building high-frequency data aggregators for Digital Asset markets and creating robust data architectures for HealthTech platforms. Proficient in the full data lifecycle: from scraping and complex ETL workflows to training Deep Learning models (LSTM, GANs, YOLOv8) and deploying them via Docker and FastAPI. Passionate about clean code, automation, and building intuitive interfaces that make complex data accessible.',

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
            'Provided structured annotations and feedback to improve LLM training data quality',
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
      institution: 'São Paulo University (USP ESALQ)',
      period: '2025 - 2027',
    },
    {
      degree: 'Technology in Management Processes',
      institution: 'Federal Institute of Rio Grande do Sul (IFRS)',
      period: '2020 - 2025',
    },
  ] satisfies ResumeEducation[],

  skills: [
    {
      group: 'Data Science & AI',
      items: [
        'Python',
        'Pandas',
        'NumPy',
        'Scikit-Learn',
        'TensorFlow',
        'PyTorch',
        'Keras',
        'YOLOv8',
        'OpenCV',
        'U-Net',
        'Transformers',
        'BERT',
        'LLMs',
        'RAG',
        'LangChain',
        'GANs',
        'LSTM',
      ],
    },
    {
      group: 'Data Engineering',
      items: [
        'SQL',
        'ETL Pipelines',
        'Web Scraping',
        'Selenium',
        'Database Design',
        'Data Cleaning',
        'FAISS',
        'Vector Databases',
      ],
    },
    {
      group: 'Full-Stack Development',
      items: [
        'FastAPI',
        'Streamlit',
        'Docker',
        'Git',
        'JavaScript',
        'React',
        'HTML',
        'CSS',
        'REST APIs',
        'JWT',
        'Authentication',
      ],
    },
    {
      group: 'Visualization & Business',
      items: [
        'Power BI',
        'Tableau',
        'Plotly',
        'Matplotlib',
        'Google Data Analytics',
        'Business Strategy',
        'Agile Methodology',
      ],
    },
  ] satisfies ResumeSkillGroup[],

  certifications: [
    { issuer: 'IBM', name: 'Data Science Professional Certificate', year: '2025' },
    { issuer: 'Google', name: 'Data Analytics Professional Certificate', year: '2025' },
    {
      issuer: 'University of Michigan',
      name: 'Statistics with Python Specialization',
      year: '2025',
    },
    {
      issuer: 'University of Pittsburgh',
      name: 'Linear Algebra and Regression for Data Science',
      year: '2025',
    },
    {
      issuer: 'Johns Hopkins University',
      name: 'Foundational Mathematics for AI',
      year: '2025',
    },
    {
      issuer: 'University of Pennsylvania / Wharton',
      name: 'Business Analytics',
      year: '2025',
    },
    {
      issuer: 'University of Virginia',
      name: 'Business Strategy Specialization',
      year: '2025',
    },
    {
      issuer: 'University of Colorado Boulder / UPenn',
      name: 'Project Management',
      year: '2025',
    },
    { issuer: 'IBM', name: 'Machine Learning Specialist (Associate)', year: '2025' },
    { issuer: 'IBM', name: 'AI Engineer Professional Certificate', year: '2026' },
  ] satisfies ResumeCertification[],
} as const;
