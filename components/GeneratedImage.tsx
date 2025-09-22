import React from 'react';
import { PhotoIcon } from './icons/Icons';

interface GeneratedImageProps {
    generatedImage: string | null;
    isLoading: boolean;
    onImageClick?: (imageUrl: string) => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center space-y-2">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-indigo-400" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-slate-400 text-sm">AI is creating your image...</p>
    </div>
);


const GeneratedImage: React.FC<GeneratedImageProps> = ({ generatedImage, isLoading, onImageClick }) => {
    return (
        <div className="w-full aspect-square bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
            {isLoading ? (
                <LoadingSpinner />
            ) : generatedImage ? (
                <div 
                    className="w-full h-full cursor-pointer group"
                    onClick={() => onImageClick && onImageClick(generatedImage)}
                    title="Click to view full image"
                >
                    <img src={generatedImage} alt="Generated result" className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                </div>
            ) : (
                <div className="text-center text-slate-500">
                    <PhotoIcon className="h-16 w-16 mx-auto mb-2" />
                    <p className="font-medium">Your generated image will appear here</p>
                    <p className="text-sm">Upload images and click "Create Image"</p>
                </div>
            )}
        </div>
    );
};

export default GeneratedImage;