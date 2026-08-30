interface PriceBreakdownProps {
  basePrice: number
  extrasPrice: number
  totalPrice: number
}

export function PriceBreakdown({ basePrice, extrasPrice, totalPrice }: PriceBreakdownProps) {
  return (
    <div className="text-sm space-y-1 rounded-lg bg-zinc-900/60 px-3 py-2 border border-zinc-800">
      <div className="flex justify-between text-zinc-400">
        <span>Тариф</span>
        <span>{basePrice} BYN</span>
      </div>
      {extrasPrice > 0 && (
        <div className="flex justify-between text-zinc-400">
          <span>Доп. услуги</span>
          <span>+{extrasPrice} BYN</span>
        </div>
      )}
      <div className="flex justify-between border-t border-zinc-700 pt-1">
        <span className="text-zinc-300 font-semibold">Итого</span>
        <span className="text-yellow-500 font-bold">{totalPrice} BYN</span>
      </div>
    </div>
  )
}
