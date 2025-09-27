import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { direction } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className={`min-h-screen flex items-center justify-center bg-background`} dir={direction}>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-foreground">404</h1>
        <p className="text-xl text-muted-foreground mb-4">{t('notFound.message')}</p>
        <a href="/" className="text-primary hover:text-primary-hover underline">
          {t('notFound.returnToDashboard')}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
