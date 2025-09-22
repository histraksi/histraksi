
import React, { useState, useEffect, useCallback } from 'react';
import { ImageFile, AspectRatio, LightingStyle, CameraAngle, StyleOptions, ArtisticStyle, OutputQuality, LocationPreference, PosePreference } from './types';
import { ASPECT_RATIOS, LIGHTING_STYLES, CAMERA_ANGLES, ARTISTIC_STYLES, OUTPUT_QUALITIES, LOCATION_PREFERENCES, POSE_PREFERENCES } from './constants';
import { generateStyledImage, removeImageBackground, analyzeImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import OptionSelector from './components/OptionSelector';
import Header from './components/Header';
import GeneratedImage from './components/GeneratedImage';
import ImageCropper from './components/ImageCropper';
import Lightbox from './components/Lightbox';
import { SparklesIcon, ExclamationTriangleIcon, UndoIcon, RedoIcon, MagicWandIcon, DownloadIcon, DocumentDownloadIcon, TagIcon, HdrIcon, GlobeAltIcon, PencilIcon } from './components/icons/Icons';
import { formatImageAspectRatio } from './utils/cropImage';

interface History<T> {
    past: T[];
    present: T;
    future: T[];
}

interface CroppingState {
    imageFile: ImageFile;
    target: 'user' | 'clothing';
    aspect: number;
}

const App: React.FC = () => {
    const [userImage, setUserImage] = useState<ImageFile | null>(null);
    const [clothingImage, setClothingImage] = useState<ImageFile | null>(null);
    const [styleImage, setStyleImage] = useState<ImageFile | null>(null);
    const [processedUserImage, setProcessedUserImage] = useState<ImageFile | null>(null);

    const [croppingState, setCroppingState] = useState<CroppingState | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const [removeBackground, setRemoveBackground] = useState(false);
    const [isRemovingBackground, setIsRemovingBackground] = useState(false);

    const [history, setHistory] = useState<History<StyleOptions>>({
        past: [],
        present: {
            aspectRatio: ASPECT_RATIOS[0].value,
            lightingStyle: LIGHTING_STYLES[0].value,
            cameraAngle: CAMERA_ANGLES[0].value,
            artisticStyle: ARTISTIC_STYLES[0].value,
            outputQuality: 'hd',
            enableHdr: false,
            locationPreference: 'random',
            customLocation: '',
            posePreference: 'standing',
            customPose: '',
        },
        future: [],
    });

    const { present: styleOptions, past, future } = history;
    const canUndo = past.length > 0;
    const canRedo = future.length > 0;

    const [userKeywords, setUserKeywords] = useState('');
    const [clothingDescription, setClothingDescription] = useState('');
    const [styleDescription, setStyleDescription] = useState('');
    const [isAnalyzingClothing, setIsAnalyzingClothing] = useState(false);
    const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);

    const setStyleOptions = useCallback((newOptions: Partial<StyleOptions>) => {
        setHistory(currentHistory => {
            const newPresent = { ...currentHistory.present, ...newOptions };
            if (JSON.stringify(newPresent) === JSON.stringify(currentHistory.present)) {
                return currentHistory;
            }
            return {
                past: [...currentHistory.past, currentHistory.present],
                present: newPresent,
                future: [],
            };
        });
    }, []);
    
    const undo = useCallback(() => {
        if (!canUndo) return;
        setHistory(currentHistory => {
            const { past, present, future } = currentHistory;
            const previous = past[past.length - 1];
            const newPast = past.slice(0, past.length - 1);
            return {
                past: newPast,
                present: previous,
                future: [present, ...future],
            };
        });
    }, [canUndo]);

    const redo = useCallback(() => {
        if (!canRedo) return;
        setHistory(currentHistory => {
            const { past, present, future } = currentHistory;
            const next = future[0];
            const newFuture = future.slice(1);
            return {
                past: [...past, present],
                present: next,
                future: newFuture,
            };
        });
    }, [canRedo]);


    const [prompt, setPrompt] = useState<string>('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const processBackground = async () => {
            if (removeBackground && userImage) {
                setIsRemovingBackground(true);
                setError(null);
                try {
                    const resultBase64 = await removeImageBackground(userImage);
                    if (resultBase64) {
                        setProcessedUserImage({
                            name: `processed_${userImage.name}`,
                            type: 'image/png', // Background removal returns PNG
                            base64: resultBase64,
                        });
                    } else {
                        setError("The model failed to remove the background. Please try another image.");
                        setRemoveBackground(false);
                    }
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during background removal.";
                    setError(errorMessage);
                    setRemoveBackground(false);
                } finally {
                    setIsRemovingBackground(false);
                }
            }
        };

        if (removeBackground && userImage) {
             processBackground();
        } else {
            setProcessedUserImage(null);
        }
    }, [userImage, removeBackground]);
    
    useEffect(() => {
        const analyzeClothing = async () => {
            if (clothingImage) {
                setIsAnalyzingClothing(true);
                setError(null);
                try {
                    const description = await analyzeImage(clothingImage, "Briefly describe the clothing item in this image (e.g., 'a casual blue t-shirt', 'a formal red evening gown').");
                    setClothingDescription(description);
                } catch (err) {
                    console.error("Failed to analyze clothing image:", err);
                    setClothingDescription(''); // Fallback
                } finally {
                    setIsAnalyzingClothing(false);
                }
            } else {
                setClothingDescription('');
            }
        };
        analyzeClothing();
    }, [clothingImage]);

    useEffect(() => {
        const analyzeStyle = async () => {
            if (styleImage) {
                setIsAnalyzingStyle(true);
                setError(null);
                try {
                    const description = await analyzeImage(styleImage, "Describe the dominant colors, textures, and overall mood of this image in a few keywords (e.g., 'warm tones, rustic texture, cozy mood').");
                    setStyleDescription(description);
                } catch (err) {
                    console.error("Failed to analyze style image:", err);
                    setStyleDescription(''); // Fallback
                } finally {
                    setIsAnalyzingStyle(false);
                }
            } else {
                setStyleDescription('');
            }
        };
        analyzeStyle();
    }, [styleImage]);


    const generatePrompt = useCallback(() => {
        const clothingText = clothingDescription ? `wearing ${clothingDescription}` : 'wearing the clothing from the product photo';
        const styleText = styleOptions.artisticStyle === 'realistic' 
            ? 'a high-quality, realistic photo' 
            : `an image in the style of an ${styleOptions.artisticStyle}`;

        let newPrompt = `**Primary Goal:** Create a new image of the person from the user's photo realistically ${clothingText}.

**Context:** This is a virtual try-on for a fashion e-commerce application. The output must be a high-quality photograph suitable for a general retail audience and must be safe for work.

**Instructions:**
1.  **Main Subject:** Use the person from the user photo as the model. Preserve their likeness.
2.  **Clothing:** Use the clothing item from the clothing photo.
3.  **Combine:** Generate a new, single, seamless image showing the person wearing the clothing.
`;

        if (styleImage) {
            newPrompt += `4. **Style Reference:** The overall mood, color palette, and composition must be heavily inspired by the provided style reference image.`;
            if (styleDescription) {
                newPrompt += ` Key elements from the reference are: ${styleDescription}.`;
            }
            newPrompt += `\n`;
        }
        
        newPrompt += `\n**Scene Details:**\n`;

        let settingDescription = '';
        switch (styleOptions.locationPreference) {
            case 'outdoors':
                settingDescription = 'A complementary outdoor environment.';
                break;
            case 'indoors':
                settingDescription = 'A complementary indoor environment.';
                break;
            case 'custom':
                settingDescription = styleOptions.customLocation || 'A setting chosen by the AI that complements the clothing and style.';
                break;
            case 'random':
            default:
                 settingDescription = 'A setting chosen by the AI that complements the clothing and style.';
                 break;
        }

        if (removeBackground) {
            newPrompt += `- **Background:** The person's original background has been removed. Place them in the following setting: ${settingDescription}\n`;
        } else {
            newPrompt += `- **Setting:** ${settingDescription}\n`;
        }

        let poseDescription = '';
        if (styleOptions.posePreference === 'custom') {
            poseDescription = styleOptions.customPose || 'a natural standing pose';
        } else {
            poseDescription = `a ${styleOptions.posePreference} pose`;
        }
        newPrompt += `- **Pose:** The person should be in ${poseDescription}.\n`;
        
        if (userKeywords) {
            newPrompt += `- **User Keywords:** Incorporate these themes: ${userKeywords}.\n`;
        }

        newPrompt += `- **Image Style:** ${styleText}.\n`;
        newPrompt += `- **Lighting:** Use ${styleOptions.lightingStyle} lighting.\n`;
        newPrompt += `- **Camera Angle:** Use a ${styleOptions.cameraAngle}.\n`;
        
        const qualityText = OUTPUT_QUALITIES.find(q => q.value === styleOptions.outputQuality)?.label || 'high';
        newPrompt += `- **Quality:** Render in stunning ${qualityText} quality.\n`;
        
        if (styleOptions.enableHdr) {
            newPrompt += `- **HDR:** Enable High Dynamic Range (HDR10+) for deep contrasts and vibrant colors.\n`;
        }

        newPrompt += `- **Aspect Ratio:** The final image must have a strict ${styleOptions.aspectRatio} aspect ratio.`;
        
        setPrompt(newPrompt);
    }, [styleOptions, styleImage, removeBackground, clothingDescription, styleDescription, userKeywords]);


    useEffect(() => {
        generatePrompt();
    }, [generatePrompt]);
    
    const handleFileSelect = (file: ImageFile | null, target: 'user' | 'clothing') => {
        if (file) {
            setCroppingState({
                imageFile: file,
                target,
                aspect: target === 'user' ? 3 / 4 : 1, // Portrait for user, square for clothing
            });
        } else {
            // Handle image removal
            if (target === 'user') {
                setUserImage(null);
                setProcessedUserImage(null);
                setRemoveBackground(false);
            } else {
                setClothingImage(null);
            }
        }
    };

    const handleCropComplete = async (croppedImageBase64WithHeader: string) => {
        if (!croppingState) return;

        const base64 = croppedImageBase64WithHeader.split(',')[1];
        const newImageFile: ImageFile = {
            name: `cropped_${croppingState.imageFile.name.replace(/\.[^/.]+$/, "")}.png`,
            type: 'image/png', // Cropper outputs PNG
            base64,
        };

        if (croppingState.target === 'user') {
            setUserImage(newImageFile);
            setProcessedUserImage(null);
        } else if (croppingState.target === 'clothing') {
            setClothingImage(newImageFile);
        }

        setCroppingState(null);
    };

    const handleUseOriginal = () => {
        if (!croppingState) return;

        const { imageFile, target } = croppingState;
        
        if (target === 'user') {
            setUserImage(imageFile);
            setProcessedUserImage(null);
        } else if (target === 'clothing') {
            setClothingImage(imageFile);
        }

        setCroppingState(null);
    };

    const handleGenerateClick = async () => {
        const finalUserImage = removeBackground ? processedUserImage : userImage;

        if (!finalUserImage || !clothingImage) {
            setError("Please upload both a photo of yourself and a clothing item.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const targetAspectRatio = styleOptions.aspectRatio;

            // Reformat images in parallel to match the target aspect ratio
            const formattedUserImagePromise = formatImageAspectRatio(finalUserImage, targetAspectRatio);
            const formattedClothingImagePromise = formatImageAspectRatio(clothingImage, targetAspectRatio);
            const formattedStyleImagePromise = styleImage ? formatImageAspectRatio(styleImage, targetAspectRatio) : Promise.resolve(null);
            
            const [formattedUserImage, formattedClothingImage, formattedStyleImage] = await Promise.all([
                formattedUserImagePromise,
                formattedClothingImagePromise,
                formattedStyleImagePromise
            ]);

            if (!formattedUserImage || !formattedClothingImage) {
                throw new Error("Failed to format images before generation.");
            }

            const result = await generateStyledImage(
                formattedUserImage,
                formattedClothingImage,
                prompt,
                formattedStyleImage
            );
            if (result) {
                setGeneratedImage(`data:image/png;base64,${result}`);
            } else {
                setError("The model did not return an image. Please try adjusting your prompt or images.");
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during image generation.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const isAnalyzing = isAnalyzingClothing || isAnalyzingStyle;
    const isGenerateButtonDisabled = !userImage || !clothingImage || isLoading || isRemovingBackground || isAnalyzing;

    const handleSaveImage = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = 'virtual-try-on.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportWithStyles = () => {
        if (!generatedImage) return;

        const img = new Image();
        img.onload = () => {
            const padding = 40;
            const textSectionHeight = 145;
            const backgroundColor = '#1e293b'; 
            const textColor = '#cbd5e1'; 
            const titleColor = '#818cf8';
            const font = '16px Inter, sans-serif';
            const titleFont = 'bold 18px Inter, sans-serif';

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const maxWidth = 1024;
            const scale = img.width > maxWidth ? maxWidth / img.width : 1;
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;

            const canvasWidth = scaledWidth + (padding * 2);
            const canvasHeight = scaledHeight + textSectionHeight + (padding * 2);

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(img, padding, padding, scaledWidth, scaledHeight);

            const textYStart = scaledHeight + padding * 1.5;

            ctx.font = titleFont;
            ctx.fillStyle = titleColor;
            ctx.fillText('Style Details', padding, textYStart);

            ctx.font = font;
            ctx.fillStyle = textColor;
            
            const artisticStyleLabel = ARTISTIC_STYLES.find(s => s.value === styleOptions.artisticStyle)?.label || styleOptions.artisticStyle;
            ctx.fillText(`Artistic Style: ${artisticStyleLabel}`, padding, textYStart + 30);

            const aspectRatioLabel = ASPECT_RATIOS.find(r => r.value === styleOptions.aspectRatio)?.label || styleOptions.aspectRatio;
            ctx.fillText(`Aspect Ratio: ${aspectRatioLabel}`, padding, textYStart + 55);

            const lightingLabel = LIGHTING_STYLES.find(l => l.value === styleOptions.lightingStyle)?.label || styleOptions.lightingStyle;
            ctx.fillText(`Lighting: ${lightingLabel}`, padding, textYStart + 80);

            const angleLabel = CAMERA_ANGLES.find(a => a.value === styleOptions.cameraAngle)?.label || styleOptions.cameraAngle;
            ctx.fillText(`Camera Angle: ${angleLabel}`, padding, textYStart + 105);

            const link = document.createElement('a');
            link.download = 'virtual-try-on-with-styles.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = generatedImage;
    };


    return (
        <div className="min-h-screen bg-slate-900 text-slate-200">
             {croppingState && (
                <ImageCropper
                    imageSrc={`data:${croppingState.imageFile.type};base64,${croppingState.imageFile.base64}`}
                    aspect={croppingState.aspect}
                    onCropComplete={handleCropComplete}
                    onUseOriginal={handleUseOriginal}
                    onCancel={() => setCroppingState(null)}
                />
            )}
            {lightboxImage && (
                <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
            )}
            <Header />
            <main className="container mx-auto p-4 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Controls Column */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                            <h2 className="text-xl font-bold mb-4 text-indigo-400">1. Upload Your Images</h2>
                            <div className="space-y-4">
                                <div>
                                    <ImageUploader
                                        id="user-image"
                                        label="Your Photo"
                                        onImageChange={(file) => handleFileSelect(file, 'user')}
                                        imageFile={userImage}
                                        overridePreviewUrl={processedUserImage ? `data:image/png;base64,${processedUserImage.base64}` : null}
                                        isProcessing={isRemovingBackground}
                                    />
                                    <div className="flex items-center justify-between mt-2 p-3 bg-slate-900/50 rounded-lg">
                                        <label htmlFor="bg-toggle" className="flex items-center cursor-pointer text-sm font-medium text-slate-300">
                                            <MagicWandIcon className="h-5 w-5 mr-3 text-indigo-400" />
                                            Remove Background
                                        </label>
                                        <button
                                            type="button"
                                            id="bg-toggle"
                                            className={`${removeBackground ? 'bg-indigo-600' : 'bg-slate-700'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                                            role="switch"
                                            aria-checked={removeBackground}
                                            onClick={() => {
                                                if (!userImage) {
                                                    setError("Please upload your photo first.");
                                                    return;
                                                }
                                                setRemoveBackground(!removeBackground);
                                            }}
                                            disabled={!userImage || isRemovingBackground}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`${removeBackground ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                            ></span>
                                        </button>
                                    </div>
                                </div>
                                <ImageUploader id="clothing-image" label="Clothing Item" onImageChange={(file) => handleFileSelect(file, 'clothing')} imageFile={clothingImage} isProcessing={isAnalyzingClothing} />
                                <ImageUploader id="style-image" label="Style Reference (Optional)" onImageChange={setStyleImage} imageFile={styleImage} isProcessing={isAnalyzingStyle} />
                            </div>
                        </div>

                        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-indigo-400">2. Define Your Style</h2>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={undo}
                                        disabled={!canUndo}
                                        className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700 hover:text-white disabled:text-slate-600 disabled:bg-transparent disabled:cursor-not-allowed transition-colors"
                                        aria-label="Undo style change"
                                    >
                                        <UndoIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={redo}
                                        disabled={!canRedo}
                                        className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700 hover:text-white disabled:text-slate-600 disabled:bg-transparent disabled:cursor-not-allowed transition-colors"
                                        aria-label="Redo style change"
                                    >
                                        <RedoIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                             <div className="space-y-4">
                                <OptionSelector
                                    label="Artistic Style"
                                    options={ARTISTIC_STYLES}
                                    value={styleOptions.artisticStyle}
                                    onChange={(e) => setStyleOptions({ artisticStyle: e.target.value as ArtisticStyle })}
                                />
                                <OptionSelector
                                    label="Aspect Ratio"
                                    options={ASPECT_RATIOS}
                                    value={styleOptions.aspectRatio}
                                    onChange={(e) => setStyleOptions({ aspectRatio: e.target.value as AspectRatio })}
                                />
                                <OptionSelector
                                    label="Lighting Style"
                                    options={LIGHTING_STYLES}
                                    value={styleOptions.lightingStyle}
                                    onChange={(e) => setStyleOptions({ lightingStyle: e.target.value as LightingStyle })}
                                />
                                <OptionSelector
                                    label="Camera Angle"
                                    options={CAMERA_ANGLES}
                                    value={styleOptions.cameraAngle}
                                    onChange={(e) => setStyleOptions({ cameraAngle: e.target.value as CameraAngle })}
                                />
                                <OptionSelector
                                    label="Pose"
                                    options={POSE_PREFERENCES}
                                    value={styleOptions.posePreference}
                                    onChange={(e) => setStyleOptions({ posePreference: e.target.value as PosePreference })}
                                />
                                {styleOptions.posePreference === 'custom' && (
                                    <div className="pl-1 -mt-2">
                                        <label htmlFor="custom-pose" className="sr-only">Custom Pose</label>
                                        <div className="relative mt-2">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <PencilIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                            </div>
                                            <input
                                                type="text"
                                                id="custom-pose"
                                                value={styleOptions.customPose}
                                                onChange={(e) => setStyleOptions({ customPose: e.target.value })}
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                placeholder="e.g., dancing, jumping, handstand"
                                            />
                                        </div>
                                    </div>
                                )}
                                <OptionSelector
                                    label="Location"
                                    icon={<GlobeAltIcon className="h-5 w-5 text-slate-400" />}
                                    options={LOCATION_PREFERENCES}
                                    value={styleOptions.locationPreference}
                                    onChange={(e) => setStyleOptions({ locationPreference: e.target.value as LocationPreference })}
                                />
                                {styleOptions.locationPreference === 'custom' && (
                                    <div className="pl-1 -mt-2">
                                        <label htmlFor="custom-location" className="sr-only">Custom Location</label>
                                        <div className="relative mt-2">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <PencilIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                            </div>
                                            <input
                                                type="text"
                                                id="custom-location"
                                                value={styleOptions.customLocation}
                                                onChange={(e) => setStyleOptions({ customLocation: e.target.value })}
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                placeholder="e.g., a Parisian cafe, a futuristic city"
                                            />
                                        </div>
                                    </div>
                                )}
                                 <OptionSelector
                                    label="Output Quality"
                                    options={OUTPUT_QUALITIES}
                                    value={styleOptions.outputQuality}
                                    onChange={(e) => setStyleOptions({ outputQuality: e.target.value as OutputQuality })}
                                />
                                <div className="flex items-center justify-between pt-2">
                                    <label htmlFor="hdr-toggle" className="flex items-center cursor-pointer text-sm font-medium text-slate-300">
                                        <HdrIcon className="h-5 w-5 mr-3 text-indigo-400" />
                                        Enable HDR 10+
                                    </label>
                                    <button
                                        type="button"
                                        id="hdr-toggle"
                                        className={`${styleOptions.enableHdr ? 'bg-indigo-600' : 'bg-slate-700'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800`}
                                        role="switch"
                                        aria-checked={styleOptions.enableHdr}
                                        onClick={() => setStyleOptions({ enableHdr: !styleOptions.enableHdr })}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`${styleOptions.enableHdr ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                        ></span>
                                    </button>
                                </div>
                                <div>
                                    <label htmlFor="user-keywords" className="block text-sm font-medium text-slate-300 mb-1">
                                        Add Keywords (Optional)
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <TagIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                        </div>
                                        <input
                                            type="text"
                                            id="user-keywords"
                                            value={userKeywords}
                                            onChange={(e) => setUserKeywords(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            placeholder="e.g., futuristic, vintage, neon lights"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Generation & Result Column */}
                    <div className="lg:col-span-8 space-y-6">
                         <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                            <h2 className="text-xl font-bold mb-4 text-indigo-400">3. AI-Generated Prompt</h2>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full h-48 p-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                placeholder="The AI will generate a prompt here..."
                                readOnly
                            />
                        </div>

                        <div className="sticky top-8">
                            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col items-center">
                                <h2 className="text-xl font-bold mb-4 text-indigo-400 self-start">4. Generate Your Image</h2>
                                {error && (
                                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4 w-full flex items-center">
                                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                                        <p>{error}</p>
                                    </div>
                                )}
                                <GeneratedImage generatedImage={generatedImage} isLoading={isLoading} onImageClick={setLightboxImage} />
                                <div className="w-full mt-4 space-y-2">
                                    <button
                                        onClick={handleGenerateClick}
                                        disabled={isGenerateButtonDisabled}
                                        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400 transition-all duration-300 transform hover:scale-105"
                                    >
                                        <SparklesIcon className="h-5 w-5 mr-2" />
                                        {isLoading ? 'Generating...' : isRemovingBackground ? 'Processing...' : isAnalyzing ? 'Analyzing...' : 'Create Image'}
                                    </button>

                                    {generatedImage && !isLoading && (
                                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                            <button
                                                onClick={handleSaveImage}
                                                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-800 transition-colors"
                                            >
                                                <DownloadIcon className="h-5 w-5 mr-2" />
                                                Save Image
                                            </button>
                                            <button
                                                onClick={handleExportWithStyles}
                                                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-800 transition-colors"
                                            >
                                                <DocumentDownloadIcon className="h-5 w-5 mr-2" />
                                                Export with Styles
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
