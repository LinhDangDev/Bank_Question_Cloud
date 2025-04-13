const Home = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trang Chủ</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Thống kê câu hỏi</h2>
          <div className="space-y-2">
            <p className="text-gray-600">Tổng số câu hỏi: 100</p>
            <p className="text-gray-600">Câu hỏi mới trong tuần: 15</p>
            <p className="text-gray-600">Câu hỏi đã sử dụng: 75</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Thống kê đề thi</h2>
          <div className="space-y-2">
            <p className="text-gray-600">Tổng số đề thi: 25</p>
            <p className="text-gray-600">Đề thi mới trong tuần: 5</p>
            <p className="text-gray-600">Đề thi đã sử dụng: 20</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Hoạt động gần đây</h2>
          <div className="space-y-2">
            <p className="text-gray-600">Tạo đề thi mới - 2 giờ trước</p>
            <p className="text-gray-600">Thêm câu hỏi - 5 giờ trước</p>
            <p className="text-gray-600">Cập nhật câu hỏi - 1 ngày trước</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
