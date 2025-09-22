
import { Option, AspectRatio, LightingStyle, CameraAngle, ArtisticStyle, OutputQuality, LocationPreference, PosePreference } from './types';

export const ASPECT_RATIOS: Option<AspectRatio>[] = [
    { label: 'Square (1:1)', value: '1:1' },
    { label: 'Widescreen (16:9)', value: '16:9' },
    { label: 'Portrait (9:16)', value: '9:16' },
    { label: 'Landscape (4:3)', value: '4:3' },
    { label: 'Classic Portrait (3:4)', value: '3:4' },
];

export const LIGHTING_STYLES: Option<LightingStyle>[] = [
    { label: 'Studio', value: 'studio' },
    { label: 'Natural Light', value: 'natural light' },
    { label: 'Golden Hour', value: 'golden hour' },
    { label: 'Dramatic', value: 'dramatic' },
    { label: 'Cinematic', value: 'cinematic' },
    { label: 'Soft Focus', value: 'soft focus' },
    { label: 'Backlit', value: 'backlit' },
    { label: 'Neon', value: 'neon' },
    { label: 'High Key', value: 'high key' },
    { label: 'Low Key', value: 'low key' },
];

export const CAMERA_ANGLES: Option<CameraAngle>[] = [
    { label: 'Eye-Level', value: 'eye-level' },
    { label: 'Full Body Shot', value: 'full body shot' },
    { label: 'Close-Up', value: 'close-up' },
    { label: 'High-Angle', value: 'high-angle' },
    { label: 'Low-Angle', value: 'low-angle' },
    { label: 'Dutch Angle', value: 'dutch angle' },
    { label: 'Bird\'s-Eye View', value: 'birds-eye-view' },
    { label: 'Worm\'s-Eye View', value: 'worms-eye-view' },
    { label: 'Over-the-Shoulder', value: 'over-the-shoulder' },
];

export const ARTISTIC_STYLES: Option<ArtisticStyle>[] = [
    { label: 'Realistic', value: 'realistic' },
    { label: 'Cartoon', value: 'cartoon' },
    { label: 'Oil Painting', value: 'oil painting' },
    { label: 'Watercolor', value: 'watercolor' },
    { label: 'Anime / Manga', value: 'anime' },
    { label: 'Pixel Art', value: 'pixel art' },
    { label: 'Line Art', value: 'line art' },
];

export const OUTPUT_QUALITIES: Option<OutputQuality>[] = [
    { label: 'Standard (SD)', value: 'sd' },
    { label: 'High Definition (HD)', value: 'hd' },
    { label: 'Full HD (FHD)', value: 'fhd' },
    { label: 'Ultra HD (4K)', value: '4k' },
];

export const LOCATION_PREFERENCES: Option<LocationPreference>[] = [
    { label: 'Random / AI Choice', value: 'random' },
    { label: 'Outdoors', value: 'outdoors' },
    { label: 'Indoors', value: 'indoors' },
    { label: 'Custom...', value: 'custom' },
];

export const POSE_PREFERENCES: Option<PosePreference>[] = [
    { label: 'Standing', value: 'standing' },
    { label: 'Sitting', value: 'sitting' },
    { label: 'Running', value: 'running' },
    { label: 'Squatting', value: 'squatting' },
    { label: 'Lying Down', value: 'lying down' },
    { label: 'Lying on Back', value: 'lying on your back' },
    { label: 'Custom...', value: 'custom' },
];
