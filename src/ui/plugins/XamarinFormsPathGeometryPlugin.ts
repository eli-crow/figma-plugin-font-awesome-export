import { PluginData, FormatPlugin } from '../../types';

import { camelCase, upperFirst } from 'lodash';

export default class XamarinFormsPathGeometryPlugin implements FormatPlugin {
    getFormatName() {
        return "Xamarin Forms PathGeometries"
    }

    getFileExtension() {
        return "xaml"
    }

    generateFileText(data: PluginData) {
        return `<?xml version="1.0" encoding="utf-8"?>

<!-- generated from Figma document "${data.figmaDocumentName}" using the "Awesome Icon Export" plugin -->
<ResourceDictionary xmlns="http://xamarin.com/schemas/2014/forms"
                    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml">
${data.icons.map(i => `\t<PathGeometry x:Key="Icon${upperFirst(camelCase(i.name))}" Figures="${i.data}" />`).join("\n")
            }
</ResourceDictionary>`;
    }
}