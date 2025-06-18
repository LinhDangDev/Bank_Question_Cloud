import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from 'lucide-react';
import { useThemeStyles, cx } from "../utils/theme";

interface FiltersProps {
  onSearch: (query: string) => void;
  onFilter?: () => void;
}

const Filters = ({ onSearch, onFilter }: FiltersProps) => {
  const styles = useThemeStyles();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-2">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm kiếm câu hỏi..."
          className={cx("pl-8 h-8 text-sm", styles.input)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        className={cx("flex items-center gap-1 h-8 text-xs", styles.outlineButton)}
        onClick={onFilter}
      >
        <Filter className="w-3 h-3" />
        Lọc
      </Button>
    </form>
  );
};

export default Filters;
