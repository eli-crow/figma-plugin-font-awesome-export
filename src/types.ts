export interface IconData {
    name: string;
    width: number;
    height: number;
    offsetX?: number;
    offsetY?: number;
    iconWidth: number;
    iconHeight: number;
    data: string;
}

export interface PluginData {
    pluginSettings: PluginSettings;
    figmaDocumentName: string;
    icons: IconData[];
};

export interface PluginSettings {
    preserveMargins?: boolean;
    fileName?: string;
    framePrefix?: string;
    format?: string;
}

export interface FormatPlugin {
    getFormatName(): string;
    getFileExtension(): string;
    generateFileText(data: PluginData): string;
}
export interface FormatPluginConstructor {
    new(data?: PluginData);
}