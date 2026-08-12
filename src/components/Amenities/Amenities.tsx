function Amenities() {
    const amenities = [
        {
            icon: (
                <svg className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 20v-6a5 5 0 015-5h8a5 5 0 015 5v6M3 20h18M3 14h18M9 9V7a3 3 0 016 0v2M4 20v2M20 20v2" />
                </svg>
            ),
            title: '2 спальни',
            description: 'Удобные кровати и свежее белье'
        },
        {
            icon: (
                <svg className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            ),
            title: 'Секретная комната',
            description: 'Приватное пространство для особых сценариев'
        },
        {
            icon: (
                <svg className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26A4.5 4.5 0 1014 14.76z" />
                </svg>
            ),
            title: 'Сауна',
            description: 'Финская сауна для релаксации'
        },
        {
            icon: (
                <svg className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 19h14a2 2 0 002-2v-5H3v5a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12V8a3 3 0 013-3 3 3 0 013 3v4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 19v2M17 19v2" />
                </svg>
            ),
            title: 'Банный чан',
            description: 'Чан с подогревом воды для отдыха на открытом воздухе'
        },
        {
            icon: (
                <svg className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
            ),
            title: 'Музыка 500 Вт',
            description: 'Профессиональная аудиосистема'
        },
        {
            icon: (
                <svg className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9h18M3 9v9a2 2 0 002 2h14a2 2 0 002-2V9M3 9l2-5h14l2 5M9 4v5M15 4v5" />
                </svg>
            ),
            title: 'Кухня',
            description: 'Полностью оборудованная современная кухня'
        },
        {
            icon: (
                <svg className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 12l2-5h6l2 5M3 12h18v5a1 1 0 01-1 1H4a1 1 0 01-1-1v-5zM7 18a2 2 0 100 4 2 2 0 000-4zM17 18a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
            ),
            title: 'Парковка',
            description: 'Бесплатная парковка на территории'
        },
        {
            icon: (
                <svg className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
            ),
            title: 'Камин',
            description: 'Уютный камин для вечерних посиделок'
        },
    ]

    return (
        <section className="py-24 sm:py-32 bg-black relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-600 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-20">
                    <div className="w-20 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mb-6"></div>
                    <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
                        <span className="text-luxury-gold">Удобства</span>
                    </h2>
                    <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto font-light">
                        Безупречный сервис и комфорт высочайшего уровня
                    </p>
                </div>

                {/* Amenities Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                    {amenities.map((amenity, index) => (
                        <div
                            key={index}
                            className="group text-center p-5 sm:p-6 lg:p-8 bg-luxury-card transition-all duration-500 border border-yellow-600/20 hover:border-yellow-600/50 shadow-luxury hover:shadow-luxury-hover hover:scale-105"
                        >
                            <div className="mb-6 transform group-hover:scale-110 transition-transform duration-500 flex justify-center">
                                {amenity.icon}
                            </div>
                            <div className="h-px w-12 bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mb-4"></div>
                            <h3 className="text-lg font-bold text-yellow-600 mb-3 uppercase tracking-wider">
                                {amenity.title}
                            </h3>
                            <p className="text-gray-400 font-light leading-relaxed">
                                {amenity.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Amenities
