import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { CropIcon, CheckCircleIcon } from './icons/Icons';
import getCroppedImg from '../utils/cropImage';

interface ImageCropperProps {
    imageSrc: string;
    aspect: number;
    onCropComplete: (croppedImageBase64: string) => void;
    onCancel: () => void;
    onUseOriginal: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, aspect, onCropComplete, onCancel, onUseOriginal }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropCompleteCallback = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCrop = async () => {
        if (!croppedAreaPixels || !imageSrc) return;

        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImage) {
                onCropComplete(croppedImage);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
                <h3 className="text-xl font-bold text-indigo-400">Crop Your Image</h3>
                <div className="relative h-96 w-full bg-slate-900 rounded-lg">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropCompleteCallback}
                    />
                </div>
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-4">
                        <label htmlFor="zoom" className="text-sm font-medium text-slate-300">Zoom</label>
                        <input
                            id="zoom"
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onUseOriginal}
                        className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-800 transition-colors"
                    >
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Use Original
                    </button>
                    <button
                        onClick={handleCrop}
                        className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        <CropIcon className="h-5 w-5 mr-2" />
                        Apply Crop
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;