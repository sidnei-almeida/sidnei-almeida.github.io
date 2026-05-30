import type { LucideIcon } from 'lucide-react';
import {
  Atom,
  Binary,
  Bot,
  Brain,
  Brackets,
  Cloud,
  Code2,
  Container,
  Database,
  Flame,
  Grid3x3,
  Hexagon,
  Layers,
  Link2,
  Network,
  ScanEye,
  Sparkles,
  Zap,
} from 'lucide-react';

export type TechStackIconId = 'nextjs' | 'huggingface' | 'groq';

export type TechStackItem = {
  name: string;
  icon: LucideIcon | TechStackIconId;
};

/** Horizontal tech stack — core stack + AI / RAG / LLM tooling */
export const techStack: TechStackItem[] = [
  { name: 'Python', icon: Code2 },
  { name: 'TypeScript', icon: Brackets },
  { name: 'React', icon: Atom },
  { name: 'Next.js', icon: 'nextjs' },
  { name: 'FastAPI', icon: Zap },
  { name: 'Node.js', icon: Hexagon },
  { name: 'PostgreSQL', icon: Database },
  { name: 'Docker', icon: Container },
  { name: 'AWS', icon: Cloud },
  { name: 'PyTorch', icon: Flame },
  { name: 'TensorFlow', icon: Layers },
  { name: 'Scikit-learn', icon: Binary },
  { name: 'OpenCV', icon: ScanEye },
  { name: 'LangChain', icon: Link2 },
  { name: 'FAISS', icon: Grid3x3 },
  { name: 'Groq', icon: 'groq' },
  { name: 'Hugging Face', icon: 'huggingface' },
  { name: 'RAG', icon: Network },
  { name: 'LLMs', icon: Brain },
  { name: 'AI Agents', icon: Bot },
  { name: 'OpenAI', icon: Sparkles },
];

export const skillHighlights = [
  { name: 'Machine Learning' },
  { name: 'Computer Vision' },
  { name: 'NLP & LLMs' },
  { name: 'RAG' },
  { name: 'FastAPI' },
  { name: 'Docker' },
  { name: 'AWS' },
  { name: 'PyTorch' },
  { name: 'LSTM' },
  { name: 'Plotly' },
  { name: 'Scikit-Learn' },
  { name: 'Python' },
  { name: 'SQL' },
  { name: 'Git' },
];
