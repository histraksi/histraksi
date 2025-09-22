import { GoogleGenAI, Modality, Part, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ImageFile } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const imageEditModel = 'gemini-2.5-flash-image-preview';
const textModel = 'gemini-2.5-flash';

// Define less restrictive safety settings to allow for a wider range of clothing styles.
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

const fileToPart = (file: ImageFile): Part => {
    return {
        inlineData: {
            mimeType: file.type,
            data: file.base64,
        },
    };
};

export const analyzeImage = async (
    image: ImageFile,
    prompt: string
): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: {
                parts: [
                    fileToPart(image),
                    { text: prompt },
                ]
            },
            config: {
                safetySettings: safetySettings,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for image analysis:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to analyze image: ${error.message}`);
        }
        throw new Error("An unknown error occurred during image analysis.");
    }
};


export const removeImageBackground = async (
    image: ImageFile
): Promise<string | null> => {
    try {
        const prompt = "Isolate the main subject in the foreground of the image and make the background completely transparent. The output must be a PNG image with a transparent alpha channel.";

        const result = await ai.models.generateContent({
            model: imageEditModel,
            contents: {
                parts: [
                    fileToPart(image),
                    { text: prompt },
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE],
                safetySettings: safetySettings,
            }
        });

        const candidate = result.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }

        if (result.promptFeedback?.blockReason) {
            throw new Error(`Background removal blocked: ${result.promptFeedback.blockReason}.`);
        }

        return null;

    } catch (error) {
        console.error("Error calling Gemini API for background removal:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to remove background: ${error.message}`);
        }
        throw new Error("An unknown error occurred during background removal.");
    }
};

export const generateStyledImage = async (
    userImage: ImageFile,
    clothingImage: ImageFile,
    prompt: string,
    styleImage: ImageFile | null
): Promise<string | null> => {
    try {
        const parts: Part[] = [
            fileToPart(userImage),
            fileToPart(clothingImage),
        ];

        if (styleImage) {
            parts.push(fileToPart(styleImage));
        }

        parts.push({ text: prompt });

        const result = await ai.models.generateContent({
            model: imageEditModel,
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                safetySettings: safetySettings,
            }
        });

        const candidate = result.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }
        
        if (result.promptFeedback?.blockReason) {
             throw new Error(`Image generation blocked: ${result.promptFeedback.blockReason}. Try adjusting your prompt or images.`);
        }
        
        return null;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while calling the Gemini API.");
    }
};