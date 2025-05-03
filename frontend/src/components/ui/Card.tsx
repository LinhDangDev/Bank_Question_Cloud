import React from 'react';
import { useThemeStyles, cx } from '../../utils/theme';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  const styles = useThemeStyles();

  return (
    <div className={cx(styles.card, className)}>
      {children}
    </div>
  );
};

export default Card;
