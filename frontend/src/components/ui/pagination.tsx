import React from 'react';
import { useThemeStyles, cx } from '../../utils/theme';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  const styles = useThemeStyles();

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    // Always show first page
    pages.push(1);

    let startPage = Math.max(2, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 2);

    // Adjust if we're near the end
    if (endPage - startPage < maxPagesToShow - 2) {
      startPage = Math.max(2, endPage - (maxPagesToShow - 2));
    }

    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pages.push('ellipsis1');
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pages.push('ellipsis2');
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers();

  return (
    <div className={cx('flex items-center justify-center my-4', className)}>
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cx(
          'px-3 py-1 mx-1 rounded-md',
          currentPage === 1
            ? `${styles.isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
            : `${styles.isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`
        )}
      >
        &laquo;
      </button>

      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis1' || page === 'ellipsis2') {
          return (
            <span
              key={`ellipsis-${index}`}
              className={cx(
                'px-3 py-1 mx-1',
                styles.isDark ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              &hellip;
            </span>
          );
        }

        return (
          <button
            key={`page-${page}`}
            onClick={() => onPageChange(page as number)}
            className={cx(
              'px-3 py-1 mx-1 rounded-md',
              currentPage === page
                ? styles.isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : styles.isDark
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
            )}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cx(
          'px-3 py-1 mx-1 rounded-md',
          currentPage === totalPages
            ? `${styles.isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
            : `${styles.isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`
        )}
      >
        &raquo;
      </button>
    </div>
  );
};
