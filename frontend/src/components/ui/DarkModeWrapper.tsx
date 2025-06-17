import React from 'react';
import { useThemeStyles, cx } from '../../utils/theme';

interface DarkModeProps {
  children: React.ReactNode;
  component?: 'div' | 'section' | 'article' | 'main';
  className?: string;
  cardStyle?: boolean;
}

/**
 * A wrapper component that applies dark mode styling to its children
 * Can be used to quickly wrap existing components with dark mode support
 */
const DarkModeWrapper: React.FC<DarkModeProps> = ({
  children,
  component = 'div',
  className = '',
  cardStyle = false
}) => {
  const styles = useThemeStyles();
  const Component = component as keyof JSX.IntrinsicElements;

  return (
    <Component
      className={cx(
        cardStyle ? styles.card.base : styles.pageContainer,
        className
      )}
    >
      {children}
    </Component>
  );
};

/**
 * DarkModeContent applies dark mode text styling to content
 */
export const DarkModeContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
}> = ({ children, className = '', muted = false }) => {
  const styles = useThemeStyles();

  return (
    <div className={cx(muted ? styles.textMuted : styles.textColor, className)}>
      {children}
    </div>
  );
};

/**
 * DarkModeHeading applies dark mode heading styling
 */
export const DarkModeHeading: React.FC<{
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}> = ({ children, className = '', as = 'h2' }) => {
  const styles = useThemeStyles();
  const Component = as as keyof JSX.IntrinsicElements;

  return (
    <Component className={cx(styles.textHeading, className)}>
      {children}
    </Component>
  );
};

export default DarkModeWrapper;
