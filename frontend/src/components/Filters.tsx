import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, Calendar, Check } from 'lucide-react';
import { useThemeStyles, cx } from "../utils/theme";
import { API_BASE_URL } from '@/config';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CLO {
  MaCLO: string;
  TenCLO: string;
}

interface FiltersProps {
  onSearch: (query: string) => void;
  onFilter?: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  isDeleted?: boolean;
  pendingApproval?: boolean;
  clo?: string;
  difficulty?: number;
  startDate?: string;
  endDate?: string;
}

const Filters = ({ onSearch, onFilter }: FiltersProps) => {
  const styles = useThemeStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [clos, setClos] = useState<CLO[]>([]);
  const [selectedCLO, setSelectedCLO] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number | undefined>(undefined);
  const [isDeleted, setIsDeleted] = useState<boolean | undefined>(false); // Default to showing active questions
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<number>(0);

  useEffect(() => {
    // Fetch CLOs
    const fetchCLOs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/clo`);
        if (!response.ok) {
          throw new Error('Failed to fetch CLOs');
        }
        const data = await response.json();
        setClos(data);
      } catch (error) {
        console.error('Error fetching CLOs:', error);
      }
    };

    fetchCLOs();
  }, []);

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (selectedCLO) count++;
    if (startDate || endDate) count++;
    if (isDeleted !== undefined) count++;
    setActiveFilters(count);
  }, [selectedCLO, startDate, endDate, difficulty, isDeleted]);

  const handleSearch = () => {
    if (searchQuery.trim().length > 0) {
      onSearch(searchQuery.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const applyFilters = () => {
    if (onFilter) {
      onFilter({
        clo: selectedCLO || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        difficulty: difficulty,
        isDeleted: isDeleted
      });
    }
    setDialogOpen(false);
  };

  const clearFilters = () => {
    setSelectedCLO('');
    setStartDate('');
    setEndDate('');
    setIsDeleted(false); // Reset to active questions
    if (onFilter) {
      onFilter({ isDeleted: false }); // Keep showing active questions by default
    }
    setDialogOpen(false);
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className="flex flex-col md:flex-row gap-2 w-full">
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Tìm kiếm câu hỏi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-10 py-2 w-full"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <Button onClick={handleSearch} className={cx(styles.primaryButton, "whitespace-nowrap")}>
          Tìm kiếm
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cx(
              "flex items-center gap-2",
              activeFilters > 0 ? "border-blue-500 bg-blue-50 text-blue-700" : ""
            )}
          >
            <Filter size={18} />
            <span>Bộ lọc</span>
            {activeFilters > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Lọc câu hỏi</h3>

            <div className="space-y-4">
              {/* CLO filter */}
              <div>
                <Label htmlFor="clo-filter">CLO</Label>
                <select
                  id="clo-filter"
                  className="w-full border rounded p-2 mt-1"
                  value={selectedCLO}
                  onChange={(e) => setSelectedCLO(e.target.value)}
                >
                  <option value="">Tất cả CLO</option>
                  {clos.map((clo) => (
                    <option key={clo.MaCLO} value={clo.MaCLO}>
                      {clo.TenCLO}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date range filter */}
              <div>
                <Label>Ngày tạo</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="start-date" className="text-xs">Từ ngày</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date" className="text-xs">Đến ngày</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>


              {/* Status filter - Removed as it's now controlled by tab selection */}
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
              <Button onClick={applyFilters}>
                Áp dụng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Filters;
