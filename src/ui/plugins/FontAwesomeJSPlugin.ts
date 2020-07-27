import { PluginData, FormatPlugin } from '../../types';

import { camelCase, upperFirst } from 'lodash';

export default class FontAwesomeJSPlugin implements FormatPlugin {
    getFormatName() {
        return 'Font Awesome JS Library'
    }

    getFileExtension() {
        return 'js'
    }

    generateFileText(data: PluginData): string {
        const iconLines = data.icons.map((icon, index) => {
            const varName = `fa${upperFirst(camelCase(icon.name))}`
            return `export const ${varName} = ${JSON.stringify({
                prefix: "fas",
                iconName: icon.name,
                icon: [
                    data.pluginSettings.preserveMargins ? icon.width : icon.iconWidth,
                    data.pluginSettings.preserveMargins ? icon.height : icon.iconHeight,
                    [],
                    'e' + index.toString().padStart(3, '0'),
                    icon.data,
                ],
            })};`;
        }).join("\n");

        return `// generated from Figma document "${data.figmaDocumentName}" using the "Awesome Icon Export" plugin
${iconLines}`;
    }
}