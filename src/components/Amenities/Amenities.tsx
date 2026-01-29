function Amenities() {
    const amenities = [
        {
            icon: (
                <svg className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
            ),
            title: 'Сауна',
            description: 'Финская сауна для релаксации'
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
            ),
            title: 'Кухня',
            description: 'Полностью оборудованная современная кухня'
        },
        {
            icon: (
                <svg className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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
        {
            icon: (
                <svg className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            ),
            title: '2 санузла',
            description: 'Современные ванные комнаты'
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
