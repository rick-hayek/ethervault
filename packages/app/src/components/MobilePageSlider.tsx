import React from 'react';

interface MobilePageSliderProps {
    children: React.ReactNode[];
    currentIndex: number;
    onIndexChange: (index: number) => void;
}

export const MobilePageSlider: React.FC<MobilePageSliderProps> = ({
    children,
    currentIndex,
}) => {
    return (
        <div className="w-full h-full relative overflow-hidden">
            {children.map((child, i) => (
                <div
                    key={i}
                    className={`absolute inset-0 w-full h-full overflow-y-auto overscroll-y-contain pb-[calc(5rem+env(safe-area-inset-bottom))] scrollbar-hide transition-opacity duration-200 ease-in-out ${
                        i === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                >
                    <div className="max-w-6xl mx-auto min-h-full">
                        {child}
                    </div>
                </div>
            ))}
        </div>
    );
};
