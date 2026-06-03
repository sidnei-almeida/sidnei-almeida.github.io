import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Project } from '../../data/projects';
import { interpolate } from '../../i18n/helpers';
import { useTranslation } from '../../i18n/useTranslation';
import { cardHoverTransition, fadeUpItem } from '../../lib/motion';
import { TechBadge } from './TechBadge';

type FeaturedProjectCardProps = {
  project: Project;
  animated?: boolean;
};

function isInternalPath(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

export function FeaturedProjectCard({ project, animated = false }: FeaturedProjectCardProps) {
  const { t } = useTranslation();

  const demoLabel = t.projects.liveDemo;
  const demoIsInternal = project.liveDemoInternal ?? (project.liveDemo ? isInternalPath(project.liveDemo) : false);

  const articleClassName = project.image
    ? 'group relative isolate grid w-full overflow-hidden bg-panel transition-shadow duration-200 hover:shadow-[0_10px_32px_rgba(0,0,0,0.28)] max-md:min-h-[320px] max-md:grid-rows-[auto_140px] md:h-[200px] md:grid-cols-[1.12fr_0.88fr] lg:h-[212px]'
    : 'group relative isolate grid w-full overflow-hidden bg-panel transition-shadow duration-200 hover:shadow-[0_10px_32px_rgba(0,0,0,0.28)] max-md:min-h-[200px] md:h-[200px] md:grid-cols-[1.12fr_0.88fr] lg:h-[212px]';

  const DemoLink = ({
    className,
    children,
    'aria-label': ariaLabel,
  }: {
    className: string;
    children: ReactNode;
    'aria-label'?: string;
  }) => {
    if (!project.liveDemo) return null;
    if (demoIsInternal) {
      return (
        <Link to={project.liveDemo} className={className} aria-label={ariaLabel}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={project.liveDemo}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  };

  const content = (
    <>
      <div className="carbon-fiber-surface relative z-10 flex min-h-0 min-w-0 flex-col justify-between p-4 md:p-5">
        <div className="min-h-0">
          <div className="mb-2 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.22em] text-ink-label md:text-[10px]">
            <span className="flex shrink-0 items-center gap-1.5">
              <span className="h-px w-2.5 bg-accent/80" aria-hidden />
              {project.number}
            </span>
            <span className="truncate text-right">{project.category}</span>
          </div>

          <h3 className="type-card-title line-clamp-2 leading-tight text-ink-primary">
            {project.title}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-[11px] leading-[1.55] text-ink-body md:mt-2 md:text-[12px]">
            {project.shortDescription}
          </p>
        </div>

        <div className="mt-2 flex min-h-0 flex-col gap-2 md:mt-0">
          <div className="flex flex-wrap gap-1 overflow-hidden">
            {project.tags.slice(0, 5).map((tag) => (
              <TechBadge key={tag} label={tag} />
            ))}
          </div>

          {(project.liveDemo || project.github) && (
            <div className="flex items-center gap-4 text-ink-label">
              {project.liveDemo && (
                <DemoLink
                  className="type-mono-link opacity-70 transition-opacity duration-150 hover:text-accent hover:opacity-100"
                  aria-label={interpolate(t.projects.liveDemoAria, { title: project.title })}
                >
                  {demoLabel}
                </DemoLink>
              )}
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="type-mono-link opacity-70 transition-opacity duration-150 hover:text-accent hover:opacity-100"
                  aria-label={interpolate(t.projects.sourceAria, { title: project.title })}
                >
                  {t.projects.source}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {project.image ? (
        <div className="relative z-0 min-h-0 overflow-hidden border-line max-md:border-t md:border-l md:border-t-0">
          <img
            src={project.image}
            alt={interpolate(t.projects.screenshotAlt, { title: project.title })}
            className="absolute inset-0 z-0 h-full w-full object-cover object-left-top opacity-75 transition duration-500 group-hover:opacity-90"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 z-[1] bg-panel/25" />
        </div>
      ) : (
        <div className="relative z-0 flex min-h-0 items-center justify-center overflow-hidden border-line bg-[#0e1011] p-4 font-mono text-[10px] leading-relaxed text-ink-muted max-md:border-t md:border-l md:border-t-0 md:text-[11px]">
          <span className="opacity-80">pedidos[0][&quot;itens&quot;][0][&quot;produto&quot;]</span>
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 z-30 border border-line transition-colors duration-300 group-hover:border-accent/35"
        aria-hidden
      />

      {project.liveDemo && (
        <DemoLink
          className="absolute bottom-3 right-3 z-40 text-accent/85 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 md:bottom-4 md:right-4"
          aria-label={interpolate(t.projects.openProjectAria, { title: project.title })}
        >
          <ArrowUpRight className="h-3.5 w-3.5 md:h-4 md:w-4" strokeWidth={1.5} />
        </DemoLink>
      )}
    </>
  );

  if (!animated) {
    return <article className={articleClassName}>{content}</article>;
  }

  return (
    <motion.article
      variants={fadeUpItem}
      whileHover={{ scale: 1.02 }}
      transition={cardHoverTransition}
      className={articleClassName}
    >
      {content}
    </motion.article>
  );
}
