export const BotSetting = () => {
    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-white px-6">
            <div className="text-center max-w-md">
                
                {/* Subtle Icon */}
                <div className="mx-auto mb-6 h-18 w-18 rounded-full border border-gray-300 flex items-center justify-center">
                    <div className="h-6 w-6 border-2 border-gray-700 rounded-sm"></div>
                </div>

                {/* Title */}
                <h1 className="text-5xl font-semibold text-black tracking-tight">
                    Bot-Setting
                </h1>

                {/* Divider */}
                <div className="w-12 h-[2px] bg-gray-300 mx-auto my-4"></div>

                {/* Subtitle */}
                <p className="text-gray-600 text-lg leading-relaxed">
                    Bot-Setting page having all the configurations related to the bot for reservation.
                </p>

                {/* Coming Soon Badge */}
                <div className="mt-6 inline-block px-4 py-2 border border-gray-300 rounded-full text-s text-gray-700 tracking-wide">
                    COMING SOON...!
                </div>
            </div>
        </div>
    );
};