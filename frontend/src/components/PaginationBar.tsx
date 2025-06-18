import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cx } from "../utils/theme";

interface PaginationBarProps {
  page: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  availableLimits: number[];
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const PaginationBar = ({
  page,
  totalPages,
  limit,
  totalItems,
  availableLimits,
  onPageChange,
  onLimitChange
}: PaginationBarProps) => {
  const [showLimitDropdown, setShowLimitDropdown] = useState<boolean>(false);
  const limitDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (limitDropdownRef.current && !limitDropdownRef.current.contains(event.target as Node)) {
        setShowLimitDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate the range of items being displayed
  const startItem = Math.min(totalItems, (page - 1) * limit + 1);
  const endItem = Math.min(page * limit, totalItems);

  return (
    <div className="flex flex-wrap justify-between items-center gap-4">
      {/* Left side - Page navigation */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-md shadow-sm">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 rounded-l-md rounded-r-none"
            disabled={page === 1}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 rounded-none border-l-0"
            disabled={page === 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center px-3 bg-white dark:bg-gray-700 border-y border-r border-l-0 border-gray-300 dark:border-gray-600">
            <span className="text-sm font-medium mx-1">{page}</span>
            <span className="text-gray-500 mx-1">/</span>
            <span className="text-sm text-gray-500 mx-1">{totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 rounded-none border-l-0"
            disabled={page === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 rounded-r-md rounded-l-none border-l-0"
            disabled={page === totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Direct page input */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Đến trang:</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={page}
            onChange={(e) => onPageChange(Math.min(Math.max(1, parseInt(e.target.value) || 1), totalPages))}
            className="w-16 h-9 px-2 text-center border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
          />
        </div>
      </div>

      {/* Right side - Display options and info */}
      <div className="flex items-center gap-4">
        {/* Limit dropdown */}
        <div className="relative" ref={limitDropdownRef}>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Hiển thị:</span>
            <button
              className="flex items-center gap-2 h-9 border rounded-md px-3 bg-white dark:bg-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-600"
              onClick={() => setShowLimitDropdown(!showLimitDropdown)}
            >
              {limit} <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {showLimitDropdown && (
            <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-10 min-w-[80px]">
              {availableLimits.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    onLimitChange(l);
                    setShowLimitDropdown(false);
                  }}
                  className={cx(
                    "block w-full text-left px-4 py-2 text-sm",
                    limit === l
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Display range */}
        <div className="text-sm text-gray-500">
          Hiển thị <span className="font-medium text-gray-900 dark:text-gray-200">{startItem}-{endItem}</span> trong số <span className="font-medium text-gray-900 dark:text-gray-200">{totalItems}</span> bản ghi
        </div>
      </div>
    </div>
  );
};

export default PaginationBar;
