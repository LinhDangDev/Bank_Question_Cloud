import React from 'react';
import { useThemeStyles, cx } from '../../utils/theme';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  const styles = useThemeStyles();

  return (
    <div className={cx(styles.pageContainer, className)}>
      {children}
    </div>
  );
};

export default PageContainer;
