
import React from 'react';
import { CameraIcon } from './icons/Icons';

const Header: React.FC = () => {
    return (
        <header className="bg-slate-800/50 backdrop-blur-sm shadow-lg sticky top-0 z-10">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center space-x-3">
                        <CameraIcon className="h-8 w-8 text-indigo-400"/>
                        <h1 className="text-2xl font-bold text-white">
                            AI Virtual Try-On Studio
                        </h1>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
