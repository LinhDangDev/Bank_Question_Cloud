import { useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'

const Search = () => {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    // Mock search - would be replaced with actual API call
    setTimeout(() => {
      const mockResults = [
        { id: 1, type: 'question', title: 'Câu hỏi về hệ điều hành Unix', subject: 'Hệ điều hành' },
        { id: 2, type: 'question', title: 'Cấu trúc dữ liệu cây nhị phân', subject: 'Cấu trúc dữ liệu' },
        { id: 3, type: 'exam', title: 'Đề thi cuối kỳ Lập trình Web', subject: 'Lập trình Web' },
        { id: 4, type: 'exam', title: 'Đề thi giữa kỳ Mạng máy tính', subject: 'Mạng máy tính' },
      ]
      setSearchResults(mockResults)
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tìm kiếm nhanh</h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập từ khóa tìm kiếm (đề thi, câu hỏi, môn học...)"
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <div className="absolute left-3 top-3.5 text-gray-400">
            <SearchIcon size={20} />
          </div>
          <button
            type="submit"
            className="absolute right-2 top-2 bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition"
          >
            Tìm kiếm
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {searchResults.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium mb-4">Kết quả tìm kiếm ({searchResults.length})</h2>

              {searchResults.map((result) => (
                <div key={result.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer">
                  <div className="flex items-start">
                    <div className={`px-2 py-1 text-xs font-semibold rounded ${
                      result.type === 'question' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {result.type === 'question' ? 'Câu hỏi' : 'Đề thi'}
                    </div>
                    <div className="ml-2">
                      <h3 className="font-medium">{result.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">Môn học: {result.subject}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy kết quả nào cho "{query}"
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

export default Search
