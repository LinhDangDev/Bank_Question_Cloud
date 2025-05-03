import { Link } from "react-router-dom";
import { useThemeStyles, cx } from "../utils/theme";

export default function NotFound() {
  const styles = useThemeStyles();

  return (
    <div className={cx("flex flex-col items-center justify-center h-screen px-4", styles.bg)}>
      <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
      <h2 className={cx("text-2xl font-semibold mb-6", styles.textHeading)}>
        Không tìm thấy trang
      </h2>
      <p className={cx("text-center max-w-md mb-8", styles.textMuted)}>
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
