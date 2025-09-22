
export interface ImageFile {
    name: string;
    type: string;
    base64: string;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type LightingStyle = 'studio' | 'natural light' | 'dramatic' | 'cinematic' | 'soft focus' | 'backlit' | 'golden hour' | 'neon' | 'high key' | 'low key';
export type CameraAngle = 'eye-level' | 'high-angle' | 'low-angle' | 'full body shot' | 'dutch angle' | 'birds-eye-view' | 'worms-eye-view' | 'over-the-shoulder' | 'close-up';
export type ArtisticStyle = 'realistic' | 'cartoon' | 'oil painting' | 'watercolor' | 'anime' | 'pixel art' | 'line art';
export type OutputQuality = 'sd' | 'hd' | 'fhd' | '4k';
export type LocationPreference = 'outdoors' | 'indoors' | 'random' | 'custom';
export type PosePreference = 'standing' | 'squatting' | 'sitting' | 'lying down' | 'lying on your back' | 'running' | 'custom';

export interface StyleOptions {
    aspectRatio: AspectRatio;
    lightingStyle: LightingStyle;
    cameraAngle: CameraAngle;
    artisticStyle: ArtisticStyle;
    outputQuality: OutputQuality;
    enableHdr: boolean;
    locationPreference: LocationPreference;
    customLocation: string;
    posePreference: PosePreference;
    customPose: string;
}

export interface Option<T> {
    label: string;
    value: T;
}
