import { useState } from 'react'
import { Send, ThumbsUp, AlertTriangle, Check } from 'lucide-react'

const Feedback = () => {
  const [formData, setFormData] = useState({
    feedbackType: '',
    subject: '',
    message: '',
    email: '',
    attachment: null as File | null
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const feedbackTypes = [
    { id: 'suggestion', name: 'Đề xuất cải tiến' },
    { id: 'bug', name: 'Báo cáo lỗi' },
    { id: 'question', name: 'Câu hỏi' },
    { id: 'other', name: 'Khác' }
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          attachment: 'Kích thước file không được vượt quá 5MB'
        }))
        e.target.value = ''
        return
      }

      setFormData(prev => ({
        ...prev,
        attachment: file
      }))

      // Clear error
      if (errors.attachment) {
        setErrors(prev => ({
          ...prev,
          attachment: ''
        }))
      }
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.feedbackType) {
      newErrors.feedbackType = 'Vui lòng chọn loại phản hồi'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Vui lòng nhập tiêu đề'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Vui lòng nhập nội dung phản hồi'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Nội dung phản hồi phải có ít nhất 10 ký tự'
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      setIsSubmitting(true)

      // Mock API call
      setTimeout(() => {
        console.log('Submitted feedback:', formData)
        setIsSubmitting(false)
        setSubmitSuccess(true)

        // Reset form
        setFormData({
          feedbackType: '',
          subject: '',
          message: '',
          email: '',
          attachment: null
        })

        // Reset success message after some time
        setTimeout(() => setSubmitSuccess(false), 5000)
      }, 1500)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gửi phản hồi</h1>

      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-md flex items-center">
          <Check className="h-5 w-5 mr-2" />
          <span>Cảm ơn bạn đã gửi phản hồi! Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Feedback Type */}
            <div>
              <label htmlFor="feedbackType" className="block text-sm font-medium text-gray-700 mb-1">
                Loại phản hồi <span className="text-red-500">*</span>
              </label>
              <select
                id="feedbackType"
                name="feedbackType"
                value={formData.feedbackType}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none ${
                  errors.feedbackType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Chọn loại phản hồi</option>
                {feedbackTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              {errors.feedbackType && <p className="mt-1 text-red-500 text-sm">{errors.feedbackType}</p>}
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Nhập tiêu đề phản hồi"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.subject ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.subject && <p className="mt-1 text-red-500 text-sm">{errors.subject}</p>}
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Mô tả chi tiết phản hồi của bạn"
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none ${
                  errors.message ? 'border-red-500' : 'border-gray-300'
                }`}
              ></textarea>
              {errors.message && <p className="mt-1 text-red-500 text-sm">{errors.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email liên hệ <span className="text-gray-500 font-normal">(không bắt buộc)</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Địa chỉ email để chúng tôi phản hồi"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="mt-1 text-red-500 text-sm">{errors.email}</p>}
            </div>

            {/* Attachment */}
            <div>
              <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1">
                Tệp đính kèm <span className="text-gray-500 font-normal">(không bắt buộc)</span>
              </label>
              <div className="flex items-center">
                <label
                  htmlFor="attachment"
                  className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Chọn tệp
                </label>
                <input
                  type="file"
                  id="attachment"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                />
                <span className="ml-3 text-sm text-gray-500">
                  {formData.attachment ? formData.attachment.name : 'Chưa có tệp nào được chọn'}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Định dạng được hỗ trợ: JPG, PNG, PDF, DOC, DOCX. Kích thước tối đa: 5MB</p>
              {errors.attachment && <p className="mt-1 text-red-500 text-sm">{errors.attachment}</p>}
            </div>

            {/* Submit button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    Gửi phản hồi
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start">
          <ThumbsUp className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Phản hồi của bạn rất quan trọng!</h3>
            <p className="mt-1 text-sm text-gray-700">
              Cảm ơn bạn đã dành thời gian chia sẻ ý kiến. Mọi phản hồi đều được chúng tôi xem xét và cải thiện hệ thống.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Báo cáo lỗi khẩn cấp</h3>
            <p className="mt-1 text-sm text-gray-700">
              Nếu bạn gặp lỗi nghiêm trọng ảnh hưởng đến công việc, vui lòng liên hệ trực tiếp qua email: <a href="mailto:support@example.com" className="text-blue-600 hover:underline">support@example.com</a> hoặc hotline: <span className="text-blue-600">1900-xxxx</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Feedback
