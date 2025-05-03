import PageContainer from '../../components/ui/PageContainer';
import Card from '../../components/ui/Card';
import { useThemeStyles } from '../../utils/theme';

const Home = () => {
  const styles = useThemeStyles();

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-4">Trang Chủ</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-2">Thống kê câu hỏi</h2>
          <div className="space-y-2">
            <p className={styles.textMuted}>Tổng số câu hỏi: 100</p>
            <p className={styles.textMuted}>Câu hỏi mới trong tuần: 15</p>
            <p className={styles.textMuted}>Câu hỏi đã sử dụng: 75</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-2">Thống kê đề thi</h2>
          <div className="space-y-2">
            <p className={styles.textMuted}>Tổng số đề thi: 25</p>
            <p className={styles.textMuted}>Đề thi mới trong tuần: 5</p>
            <p className={styles.textMuted}>Đề thi đã sử dụng: 20</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-2">Hoạt động gần đây</h2>
          <div className="space-y-2">
            <p className={styles.textMuted}>Tạo đề thi mới - 2 giờ trước</p>
            <p className={styles.textMuted}>Thêm câu hỏi - 5 giờ trước</p>
            <p className={styles.textMuted}>Cập nhật câu hỏi - 1 ngày trước</p>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}

export default Home
