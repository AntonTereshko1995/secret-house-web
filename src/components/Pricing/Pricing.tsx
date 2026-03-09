import { Link } from 'react-router-dom'
import { TARIFF_CONFIG, TARIFF_SALE_CONFIG } from '../../utils/booking'

const INCOGNITO_TARIFFS = [
  {
    id: 'incognito-daily',
    name: 'Инкогнито Суточно',
    duration: '24 часа',
    features: ['до 6 гостей', 'Фотосессия включена', 'Трансфер', 'Полная конфиденциальность'],
  },
  {
    id: 'incognito-12h',
    name: 'Инкогнито 12 часов',
    duration: '12 часов',
    features: ['до 6 гостей', 'Трансфер', 'Полная конфиденциальность'],
  },
  {
    id: 'incognito-work',
    name: 'Инкогнито Рабочий',
    duration: '11 часов · будни',
    features: ['до 6 гостей', 'Трансфер', 'Полная конфиденциальность'],
  },
]

const STANDARD_TARIFFS = [
  {
    id: 'daily-3plus',
    name: 'Суточно от 3 человек',
    duration: '24 часа',
    features: ['3–6 гостей', 'Сауна +100 BYN', 'Фотосессия +100 BYN'],
  },
  {
    id: 'daily-couple',
    name: 'Суточно для двоих',
    duration: '24 часа',
    features: ['2 гостя (+200 за доп.)', 'Сауна +100 BYN', 'Фотосессия +100 BYN'],
  },
  {
    id: '12h-standard',
    name: '12 часов',
    duration: '12 часов',
    features: ['2 гостя (+70 за доп.)', 'Сауна +100 BYN', 'Секретная комната +70 BYN', 'Доп. спальня +70 BYN'],
  },
  {
    id: 'work-standard',
    name: 'Рабочий',
    duration: '11 часов · будни',
    features: ['2 гостя (+100 за доп.)', 'Сауна +100 BYN', 'Секретная комната +50 BYN', 'Доп. спальня +50 BYN'],
  },
]

interface TariffCardProps {
  id: string
  name: string
  duration: string
  features: string[]
  incognito?: boolean
}

function TariffCard({ id, name, duration, features, incognito }: TariffCardProps) {
  const price = TARIFF_CONFIG[id as keyof typeof TARIFF_CONFIG]?.price ?? 0
  const salePrice = TARIFF_SALE_CONFIG[id as keyof typeof TARIFF_SALE_CONFIG]?.price ?? 0
  const hasSale = salePrice > 0 && salePrice < price

  return (
    <div className={`
      group flex flex-col p-6 border transition-all duration-500 bg-luxury-card shadow-luxury hover:shadow-luxury-hover hover:scale-[1.02]
      ${incognito ? 'border-yellow-600/50 hover:border-yellow-600' : 'border-yellow-600/20 hover:border-yellow-600/50'}
    `}>
      {/* Badge + duration */}
      <div className="flex items-center justify-between mb-4">
        {incognito ? (
          <span className="text-[10px] font-bold uppercase tracking-widest text-black bg-yellow-600 px-2 py-0.5">
            Инкогнито
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-600/60 border border-yellow-600/30 px-2 py-0.5">
            Стандарт
          </span>
        )}
        <span className="text-xs text-gray-500 uppercase tracking-wider">{duration}</span>
      </div>

      {/* Name */}
      <h3 className="text-base font-bold text-white uppercase tracking-wider mb-4 leading-snug">
        {name}
      </h3>

      {/* Price */}
      <div className="mb-5">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-yellow-600">{price}</span>
          <span className="text-sm text-gray-400">BYN</span>
        </div>
        {hasSale && (
          <p className="text-xs text-gray-500 mt-1">от {salePrice} BYN в будни</p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-yellow-600/30 to-transparent mb-5" />

      {/* Features */}
      <ul className="flex-1 space-y-2 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        to="/booking"
        className={`
          block text-center text-xs font-bold uppercase tracking-widest py-2.5 px-4 transition-all duration-300
          ${incognito
            ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
            : 'border border-yellow-600/50 hover:border-yellow-600 hover:bg-yellow-600/10 text-yellow-600'}
        `}
      >
        Забронировать
      </Link>
    </div>
  )
}

function Pricing() {
  return (
    <section className="py-24 sm:py-32 bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-600 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mb-6" />
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-luxury-gold">Тарифы</span>
          </h2>
          <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto font-light">
            Цены указаны для выходных и праздничных дней
          </p>
        </div>

        {/* Incognito group */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-yellow-600/20" />
            <span className="text-xs font-bold uppercase tracking-widest text-yellow-600">Инкогнито — полная конфиденциальность</span>
            <div className="h-px flex-1 bg-yellow-600/20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {INCOGNITO_TARIFFS.map((t) => (
              <TariffCard key={t.id} {...t} incognito />
            ))}
          </div>
        </div>

        {/* Standard group */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-yellow-600/20" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Стандартные тарифы</span>
            <div className="h-px flex-1 bg-yellow-600/20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STANDARD_TARIFFS.map((t) => (
              <TariffCard key={t.id} {...t} />
            ))}
          </div>
        </div>

        {/* Note */}
        <p className="text-center text-xs text-gray-600 mt-10 uppercase tracking-wider">
          Доп. час — 30 BYN · Скидки в будни · Промокоды применяются при бронировании
        </p>
      </div>
    </section>
  )
}

export default Pricing
