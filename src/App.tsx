import { AnimatePresence } from 'framer-motion';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { PageTransition } from './components/motion/PageTransition';
import { PageShell } from './components/layout/PageShell';
import { I18nProvider } from './i18n/I18nProvider';
import { ContactPage } from './pages/ContactPage';
import { Home } from './pages/Home';
import { LanguageRedirectPage } from './pages/LanguageRedirectPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ResumePage } from './pages/ResumePage';
import { MentoriaPage } from './pages/MentoriaPage';
import { PythonOrdersExercisePage } from './pages/PythonOrdersExercisePage';
import { ResumePrintPage } from './pages/ResumePrintPage';

function AppLayout() {
  const location = useLocation();

  return (
    <PageShell>
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </AnimatePresence>
    </PageShell>
  );
}

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <Routes>
          <Route path="/lang/:code" element={<LanguageRedirectPage />} />
          <Route path="/resume/print" element={<ResumePrintPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/mentoria" element={<MentoriaPage />} />
            <Route path="/exercises/analise-pedidos-python" element={<PythonOrdersExercisePage />} />
          </Route>
        </Routes>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
