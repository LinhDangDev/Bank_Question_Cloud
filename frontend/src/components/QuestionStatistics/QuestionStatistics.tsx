import React from 'react';
import {
  BarChart3,
  FileText,
  Users,
  Image,
  Volume2,
  Target,
  TrendingUp,
  PieChart,
  Activity
} from 'lucide-react';
import { QuestionStatistics as QuestionStatsType, QuestionType } from '../../types/question-parser.types';

interface QuestionStatisticsProps {
  statistics: QuestionStatsType;
  showDetailed?: boolean;
  className?: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle?: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  color,
  trend
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600'
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100',
    red: 'bg-red-100',
    indigo: 'bg-indigo-100'
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{title}</p>
            {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend.isPositive ? '' : 'rotate-180'}`} />
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QuestionStatistics: React.FC<QuestionStatisticsProps> = ({
  statistics,
  showDetailed = false,
  className = ''
}) => {
  const getQuestionTypeLabel = (type: string): string => {
    switch (type) {
      case 'single':
        return 'Đơn lựa chọn';
      case 'group':
        return 'Nhóm câu hỏi';
      case 'fill_in_blank':
        return 'Điền khuyết';
      default:
        return type;
    }
  };

  const getCLOLabel = (clo: string): string => {
    return `CLO ${clo}`;
  };

  const getDifficultyLabel = (difficulty: string): string => {
    switch (difficulty) {
      case '1':
        return 'Dễ';
      case '2':
        return 'Trung bình';
      case '3':
        return 'Khó';
      default:
        return `Cấp độ ${difficulty}`;
    }
  };

  const getDifficultyColor = (difficulty: string): 'green' | 'orange' | 'red' => {
    switch (difficulty) {
      case '1':
        return 'green';
      case '2':
        return 'orange';
      case '3':
        return 'red';
      default:
        return 'orange';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          title="Tổng câu hỏi"
          value={statistics.totalQuestions}
          color="blue"
        />
        
        <StatCard
          icon={<Users className="w-5 h-5" />}
          title="Đơn lựa chọn"
          value={statistics.singleQuestions}
          subtitle={`${Math.round((statistics.singleQuestions / statistics.totalQuestions) * 100)}%`}
          color="green"
        />
        
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          title="Nhóm câu hỏi"
          value={statistics.groupQuestions}
          subtitle={`${Math.round((statistics.groupQuestions / statistics.totalQuestions) * 100)}%`}
          color="purple"
        />
        
        <StatCard
          icon={<Target className="w-5 h-5" />}
          title="Điền khuyết"
          value={statistics.fillInBlankQuestions}
          subtitle={`${Math.round((statistics.fillInBlankQuestions / statistics.totalQuestions) * 100)}%`}
          color="orange"
        />
      </div>

      {/* Media Statistics */}
      {(statistics.questionsWithMedia > 0 || statistics.totalMediaFiles > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            icon={<Image className="w-5 h-5" />}
            title="Câu hỏi có media"
            value={statistics.questionsWithMedia}
            subtitle={`${Math.round((statistics.questionsWithMedia / statistics.totalQuestions) * 100)}% tổng số`}
            color="indigo"
          />
          
          <StatCard
            icon={<Volume2 className="w-5 h-5" />}
            title="File media"
            value={statistics.totalMediaFiles}
            subtitle="Hình ảnh và âm thanh"
            color="red"
          />
        </div>
      )}

      {/* Detailed Statistics */}
      {showDetailed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CLO Distribution */}
          {Object.keys(statistics.cloDistribution).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Phân bố CLO</h3>
              </div>
              
              <div className="space-y-3">
                {Object.entries(statistics.cloDistribution)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([clo, count]) => {
                    const percentage = Math.round((count / statistics.totalQuestions) * 100);
                    return (
                      <div key={clo} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-900">
                            {getCLOLabel(clo)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {count} ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Difficulty Distribution */}
          {Object.keys(statistics.difficultyDistribution).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Phân bố độ khó</h3>
              </div>
              
              <div className="space-y-3">
                {Object.entries(statistics.difficultyDistribution)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([difficulty, count]) => {
                    const percentage = Math.round((count / statistics.totalQuestions) * 100);
                    const color = getDifficultyColor(difficulty);
                    const colorClasses = {
                      green: 'bg-green-500',
                      orange: 'bg-orange-500',
                      red: 'bg-red-500'
                    };
                    
                    return (
                      <div key={difficulty} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 ${colorClasses[color]} rounded-full`}></div>
                          <span className="text-sm font-medium text-gray-900">
                            {getDifficultyLabel(difficulty)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`${colorClasses[color]} h-2 rounded-full`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {count} ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Insights */}
      {showDetailed && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Tóm tắt phân tích</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3">
              <p className="font-medium text-gray-900">Loại câu hỏi phổ biến nhất</p>
              <p className="text-blue-600">
                {statistics.singleQuestions >= statistics.groupQuestions && statistics.singleQuestions >= statistics.fillInBlankQuestions
                  ? 'Đơn lựa chọn'
                  : statistics.groupQuestions >= statistics.fillInBlankQuestions
                  ? 'Nhóm câu hỏi'
                  : 'Điền khuyết'
                }
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <p className="font-medium text-gray-900">Tỷ lệ có media</p>
              <p className="text-blue-600">
                {Math.round((statistics.questionsWithMedia / statistics.totalQuestions) * 100)}%
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <p className="font-medium text-gray-900">Số CLO khác nhau</p>
              <p className="text-blue-600">
                {Object.keys(statistics.cloDistribution).length} CLO
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionStatistics;
