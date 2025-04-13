import { Link } from "react-router-dom";


export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
      <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Không tìm thấy trang</h2>
      <p className="text-gray-600 text-center max-w-md mb-8">
        Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không có sẵn.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Quay lại trang chủ
      </Link>
    </div>
  );
}
