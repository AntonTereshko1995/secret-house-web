import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { getEnv } from '../../../utils/env'
import { logger } from '../../../services/logger'
import type { GiftStepProps } from '../../../types/gift.types'

interface GiftStepPaymentProps extends GiftStepProps {
  onSubmit: (receiptFile: File) => Promise<void>
}

function GiftStepPayment({ giftData, prevStep, onSubmit }: GiftStepPaymentProps) {
  const [receiptFile, setReceiptFile] = useState<File | null>(giftData.receiptFile ?? null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bankCardNumber = getEnv('VITE_BANK_CARD_NUMBER')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      logger.info('gift_receipt_attached', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        totalPrice: giftData.totalPrice,
      })
      setReceiptFile(file)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setReceiptPreview(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        setReceiptPreview(null)
      }
    }
  }, [giftData.totalPrice])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10485760,
    multiple: false,
  })

  const handleSubmit = async () => {
    if (!receiptFile) {
      alert('Пожалуйста, загрузите чек об оплате')
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit(receiptFile)
    } catch (error) {
      logger.error('gift_receipt_submit_error', {
        message: error instanceof Error ? error.message : String(error),
      })
      alert('Ошибка при отправке. Пожалуйста, попробуйте ещё раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg font-bold text-white mb-1 uppercase tracking-wider">
        Оплата сертификата
      </h2>
      <p className="text-gray-400 mb-3 text-sm">
        Переведите оплату и загрузите чек об оплате
      </p>

      <div className="bg-black/60 border border-zinc-800 rounded-lg px-4 py-3 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">К оплате:</span>
          <span className="text-amber-400 font-bold text-2xl">{giftData.totalPrice} BYN</span>
        </div>
      </div>

      {bankCardNumber && (
        <div className="bg-black/60 border border-zinc-700 rounded-lg px-4 py-3 mb-3">
          <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            📌 Способы оплаты (BSB-Bank)
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">💳 По номеру карты:</span>
            <span className="text-white text-sm font-bold tracking-widest">{bankCardNumber}</span>
          </div>
          <div className="text-gray-500 text-xs mt-2">
            💡 После оплаты вы получите код сертификата в Telegram/SMS
          </div>
        </div>
      )}

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
              <img src={receiptPreview} alt="Чек" className="max-h-24 mx-auto rounded mb-2" />
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
            <div className="text-gray-500 text-xs">JPG, PNG, PDF · макс. 10 МБ</div>
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
          disabled={!receiptFile || isSubmitting}
          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </button>
      </div>
    </div>
  )
}

export default GiftStepPayment
