import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { calculatePrepayment, getHolidayName } from '../../../utils/booking'
import { getEnv } from '../../../utils/env'
import type { BookingFormData, StepProps } from '../../../types/booking.types'

function Step11Receipt({ formData, updateFormData, prevStep, onSubmit }: StepProps) {
  const [receiptFile, setReceiptFile] = useState<File | null>(formData.receiptFile || null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(formData.receiptPreview || null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const checkInDate = formData.checkInDate ? new Date(formData.checkInDate) : null
  const totalPrice = formData.totalPrice ?? 0
  const holidayName = checkInDate ? getHolidayName(checkInDate) : null
  const giftCovered = formData.giftId && formData.giftPrice !== undefined ? formData.giftPrice : 0
  const prepayment = giftCovered > 0
    ? Math.max(0, totalPrice - giftCovered)
    : checkInDate ? calculatePrepayment(totalPrice, checkInDate) : Math.round(totalPrice * 0.5)
  const isFullyCoveredByGift = giftCovered > 0 && prepayment === 0
  const isFullPayment = isFullyCoveredByGift || prepayment === totalPrice

  const bankCardNumber = getEnv('VITE_BANK_CARD_NUMBER')

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
    if (!receiptFile && !isFullyCoveredByGift) {
      alert('Пожалуйста, загрузите чек или документ об оплате')
      return
    }
    setIsSubmitting(true)
    try {
      const receiptData: Partial<BookingFormData> = {
        receiptFile: receiptFile ?? undefined,
        receiptPreview: receiptPreview || undefined,
        submittedAt: new Date(),
      }
      updateFormData(receiptData)
      await onSubmit?.(receiptData)
    } catch (error) {
      console.error('Submission error:', error)
      alert('Ошибка при отправке бронирования. Пожалуйста, попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg font-bold text-white mb-1 uppercase tracking-wider">
        Загрузка чека
      </h2>
      <p className="text-gray-400 mb-3 text-sm">
        Загрузите фото или документ с подтверждением оплаты
      </p>

      {/* Price */}
      <div className="bg-black/60 border border-zinc-800 rounded-lg px-4 py-2 mb-3">
        {holidayName && !isFullyCoveredByGift && (
          <div className="text-amber-400 text-xs mb-1.5">
            🎉 {holidayName} — требуется полная предоплата
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Итого:</span>
          <span className="text-gray-300 text-sm font-semibold">{totalPrice} BYN</span>
        </div>
        {giftCovered > 0 && (
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-400 text-sm">Сертификат покрывает:</span>
            <span className="text-green-400 text-sm font-semibold">−{giftCovered} BYN</span>
          </div>
        )}
        {isFullyCoveredByGift ? (
          <div className="mt-2 text-green-400 text-sm font-semibold text-center">
            ✓ Бронирование полностью покрыто сертификатом
          </div>
        ) : (
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-400 text-sm">
              {giftCovered > 0 ? 'Доплата:' : `Предоплата (${isFullPayment ? '100%' : '50%'}):`}
            </span>
            <span className="text-amber-400 font-bold text-xl">{prepayment} BYN</span>
          </div>
        )}
      </div>

      {/* Payment details */}
      {!isFullyCoveredByGift && bankCardNumber && (
        <div className="bg-black/60 border border-zinc-700 rounded-lg px-4 py-3 mb-3">
          <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            📌 Способы оплаты (BSB-Bank)
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">💳 По номеру карты:</span>
            <span className="text-white text-sm font-bold tracking-widest">{bankCardNumber}</span>
          </div>
          <div className="text-gray-500 text-xs mt-2">
            💡 Предоплата не возвращается при отмене, но вы можете перенести бронь на другую дату.
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-5 mb-3 cursor-pointer transition-all text-center
          ${isDragActive
            ? 'border-amber-400 bg-amber-400/10'
            : receiptFile
            ? 'border-green-500 bg-green-500/10'
            : 'border-gray-700 hover:border-zinc-500 bg-gray-800'}
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
          className="flex-1 border border-zinc-600 bg-transparent hover:bg-zinc-800/50 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Назад
        </button>
        <button
          onClick={handleSubmit}
          disabled={(!receiptFile && !isFullyCoveredByGift) || isSubmitting}
          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </button>
      </div>
    </div>
  )
}

export default Step11Receipt
