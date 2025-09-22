import React, { useRef } from 'react';
import { ImageFile } from '../types';
import { UploadIcon, XCircleIcon } from './icons/Icons';

interface ImageUploaderProps {
    id: string;
    label: string;
    onImageChange: (file: ImageFile | null) => void;
    imageFile: ImageFile | null;
    overridePreviewUrl?: string | null;
    isProcessing?: boolean;
}

const ProcessingSpinner: React.FC = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/80 rounded-md backdrop-blur-sm z-10">
        <svg className="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-slate-300 text-xs mt-2">Processing...</p>
    </div>
);


const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, onImageChange, imageFile, overridePreviewUrl, isProcessing }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                onImageChange({
                    name: file.name,
                    type: file.type,
                    base64: base64String,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        onImageChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const currentPreview = overridePreviewUrl || (imageFile ? `data:${imageFile.type};base64,${imageFile.base64}` : null);
    const fileName = imageFile?.name || '';

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
            <div
                onClick={() => fileInputRef.current?.click()}
                className="relative mt-1 flex justify-center items-center h-40 px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md cursor-pointer hover:border-indigo-500 transition-colors"
            >
                {isProcessing && <ProcessingSpinner />}
                {currentPreview ? (
                    <>
                        <img src={currentPreview} alt="Preview" className="max-h-full rounded-md object-contain" />
                        <button
                            onClick={handleRemoveImage}
                            className="absolute top-1 right-1 p-0.5 bg-slate-800/70 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 transition-colors z-20"
                            aria-label="Remove image"
                        >
                            <XCircleIcon className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-1 left-1 right-1 p-1 bg-slate-900/70 text-center text-xs text-slate-300 rounded-b-md truncate">
                            {fileName}
                        </div>
                    </>
                ) : (
                    <div className="space-y-1 text-center">
                        <UploadIcon className="mx-auto h-12 w-12 text-slate-500" />
                        <div className="flex text-sm text-slate-400">
                            <p className="pl-1">Click to upload a file</p>
                        </div>
                        <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                    </div>
                )}
                 <input
                    ref={fileInputRef}
                    id={id}
                    name={id}
                    type="file"
                    className="sr-only"
                    accept="image/png, image/jpeg"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
};

export default ImageUploader;