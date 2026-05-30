import { ArrowUpRight } from 'lucide-react';
import type { Project } from '../../data/projects';
import { ProjectLinks } from './ProjectLinks';
import { TechBadge } from './TechBadge';

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="group relative flex h-full min-h-[380px] max-h-[440px] flex-col overflow-hidden border border-line bg-panel transition-colors hover:border-line-soft">
      {project.image && (
        <div className="relative aspect-[16/9] shrink-0 overflow-hidden border-b border-line bg-canvas-raised">
          <img
            src={project.image}
            alt={`${project.title} interface screenshot`}
            className="h-full w-full object-cover object-top opacity-90 transition-opacity duration-300 group-hover:opacity-100"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel/80 via-transparent to-transparent" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.22em] text-ink-faint">
          <span className="flex items-center text-ink-muted">
            <span className="mr-1.5 inline-block h-px w-2 bg-accent" aria-hidden />
            {project.number}
          </span>
          <span className="truncate text-right">{project.category}</span>
        </div>

        <h3 className="type-card-title mb-2 line-clamp-2 leading-snug text-ink-bright">
          {project.title}
        </h3>

        <p className="mb-3 line-clamp-2 flex-1 text-xs leading-relaxed text-ink-secondary md:text-[13px]">
          {project.shortDescription}
        </p>

        <div className="mt-auto space-y-3">
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 4).map((tag) => (
              <TechBadge key={tag} label={tag} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
            <ProjectLinks liveDemo={project.liveDemo} github={project.github} compact />
            {project.liveDemo && (
              <a
                href={project.liveDemo}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-label={`Open ${project.title}`}
              >
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
