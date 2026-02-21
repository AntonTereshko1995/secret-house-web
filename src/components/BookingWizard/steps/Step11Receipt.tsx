import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { generateBookingId, calculatePrepayment, getHolidayName } from '../../../utils/booking'
import type { BookingFormData, StepProps } from '../../../types/booking.types'

function Step11Receipt({ formData, updateFormData, prevStep, onSubmit }: StepProps) {
  const [receiptFile, setReceiptFile] = useState<File | null>(formData.receiptFile || null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(formData.receiptPreview || null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const checkInDate = formData.checkInDate ? new Date(formData.checkInDate) : null
  const totalPrice = formData.totalPrice ?? 0
  const prepayment = checkInDate ? calculatePrepayment(totalPrice, checkInDate) : Math.round(totalPrice * 0.5)
  const holidayName = checkInDate ? getHolidayName(checkInDate) : null
  const isFullPayment = prepayment === totalPrice

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setReceiptFile(file)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setReceiptPreview(e.target?.result as string)
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
    maxSize: 5242880,
    multiple: false
  })

  const handleSubmit = async () => {
    if (!receiptFile) {
      alert('Пожалуйста, загрузите чек или документ об оплате')
      return
    }
    setIsSubmitting(true)
    try {
      const bookingId = generateBookingId()
      const finalData: Partial<BookingFormData> = {
        ...formData,
        receiptFile,
        receiptPreview: receiptPreview || undefined,
        bookingId,
        submittedAt: new Date()
      }
      updateFormData(finalData)
      await new Promise(resolve => setTimeout(resolve, 1500))
      onSubmit?.()
    } catch (error) {
      console.error('Submission error:', error)
      alert('Ошибка при отправке бронирования. Пожалуйста, попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-yellow-600/30">
      <h2 className="text-lg font-bold text-luxury-gold mb-1 uppercase tracking-wider">
        Загрузка чека
      </h2>
      <p className="text-gray-400 mb-3 text-sm">
        Загрузите фото или документ с подтверждением оплаты
      </p>

      {/* Price */}
      <div className="bg-black border border-yellow-600/30 rounded-lg px-4 py-2 mb-3">
        {holidayName && (
          <div className="text-yellow-600 text-xs mb-1.5">
            🎉 {holidayName} — требуется полная предоплата
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Итого:</span>
          <span className="text-gray-300 text-sm font-semibold">{totalPrice} BYN</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-gray-400 text-sm">
            Предоплата ({isFullPayment ? '100%' : '50%'}):
          </span>
          <span className="text-yellow-600 font-bold text-xl">{prepayment} BYN</span>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-5 mb-3 cursor-pointer transition-all text-center
          ${isDragActive
            ? 'border-yellow-600 bg-yellow-600/10'
            : receiptFile
            ? 'border-green-500 bg-green-500/10'
            : 'border-gray-700 hover:border-yellow-600/50 bg-gray-800'}
        `}
      >
        <input {...getInputProps()} />

        {receiptFile ? (
          <>
            {receiptPreview ? (
              <img src={receiptPreview} alt="Receipt" className="max-h-24 mx-auto rounded mb-2" />
            ) : (
              <div className="text-3xl mb-1">📄</div>
            )}
            <div className="text-white text-sm font-bold">{receiptFile.name}</div>
            <div className="text-green-500 text-xs mt-1">✓ Файл загружен · нажмите для замены</div>
          </>
        ) : (
          <>
            <div className="text-3xl mb-1">{isDragActive ? '📥' : '📁'}</div>
            <div className="text-white text-sm font-bold mb-1">
              {isDragActive ? 'Отпустите файл' : 'Перетащите или нажмите'}
            </div>
            <div className="text-gray-500 text-xs">JPG, PNG, PDF · макс. 5 МБ</div>
          </>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          disabled={isSubmitting}
          className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 uppercase tracking-wider transition-all"
        >
          Назад
        </button>
        <button
          onClick={handleSubmit}
          disabled={!receiptFile || isSubmitting}
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-2 px-4 uppercase tracking-wider transition-all"
        >
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </button>
      </div>
    </div>
  )
}

export default Step11Receipt
