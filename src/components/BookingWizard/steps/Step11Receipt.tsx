import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { generateBookingId } from '../../../utils/booking'
import type { BookingFormData, StepProps } from '../../../types/booking.types'

function Step11Receipt({ formData, updateFormData, prevStep, onSubmit }: StepProps) {
  const [receiptFile, setReceiptFile] = useState<File | null>(formData.receiptFile || null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(formData.receiptPreview || null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setReceiptFile(file)

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setReceiptPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setReceiptPreview(null)
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5242880, // 5MB
    multiple: false
  })

  const handleSubmit = async () => {
    if (!receiptFile) {
      alert('Пожалуйста, загрузите чек или документ об оплате')
      return
    }

    setIsSubmitting(true)

    try {
      // Generate booking ID
      const bookingId = generateBookingId()

      // Update form data with receipt and metadata
      const finalData: Partial<BookingFormData> = {
        ...formData,
        receiptFile,
        receiptPreview: receiptPreview || undefined,
        bookingId,
        submittedAt: new Date()
      }

      updateFormData(finalData)

      // Simulate API call (replace with actual API)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Call parent submit handler
      onSubmit?.()
    } catch (error) {
      console.error('Submission error:', error)
      alert('Ошибка при отправке бронирования. Пожалуйста, попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  return (
    <div className="bg-gray-900 p-5 sm:p-6 rounded-lg border border-yellow-600/30">
      <h2 className="text-2xl sm:text-3xl font-bold text-luxury-gold mb-6 uppercase tracking-wider">
        Загрузка чека
      </h2>
      <p className="text-gray-400 mb-6">
        Загрузите фото или документ с подтверждением оплаты
      </p>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 mb-6 cursor-pointer transition-all
          ${isDragActive
            ? 'border-yellow-600 bg-yellow-600/10'
            : receiptFile
            ? 'border-green-500 bg-green-500/10'
            : 'border-gray-700 hover:border-yellow-600/50 bg-gray-800'}
        `}
      >
        <input {...getInputProps()} />

        {receiptFile ? (
          <div className="text-center">
            {receiptPreview ? (
              <div className="mb-4">
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="max-w-full max-h-48 mx-auto rounded-lg"
                />
              </div>
            ) : (
              <div className="text-6xl mb-4">📄</div>
            )}
            <div className="text-white font-bold mb-2">{receiptFile.name}</div>
            <div className="text-gray-400 text-sm mb-4">
              {formatFileSize(receiptFile.size)}
            </div>
            <div className="text-green-500 text-sm font-semibold">
              ✓ Файл загружен успешно
            </div>
            <div className="text-gray-400 text-xs mt-2">
              Кликните или перетащите для замены
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">
              {isDragActive ? '📥' : '📁'}
            </div>
            <div className="text-white font-bold mb-2">
              {isDragActive ? 'Отпустите файл здесь' : 'Перетащите файл сюда'}
            </div>
            <div className="text-gray-400 text-sm mb-4">
              или кликните для выбора
            </div>
            <div className="text-gray-500 text-xs">
              Поддерживаются: JPG, PNG, PDF (макс. 5 МБ)
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <div className="text-gray-400 text-sm">
          💡 Загрузите скриншот платежа, банковскую квитанцию или любой другой документ, подтверждающий оплату.
        </div>
      </div>

      {/* Summary */}
      <div className="bg-black border border-yellow-600/30 p-6 rounded-lg mb-6">
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-2">Итоговая сумма к оплате:</div>
          <div className="text-yellow-600 font-bold text-4xl mb-4">
            {formData.totalPrice} BYN
          </div>
          <div className="text-gray-400 text-xs">
            После отправки мы свяжемся с вами для подтверждения
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          disabled={isSubmitting}
          className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 uppercase tracking-wider transition-all"
        >
          Назад
        </button>
        <button
          onClick={handleSubmit}
          disabled={!receiptFile || isSubmitting}
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-3 px-6 uppercase tracking-wider transition-all shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? 'Отправка...' : 'Отправить бронирование'}
        </button>
      </div>
    </div>
  )
}

export default Step11Receipt
