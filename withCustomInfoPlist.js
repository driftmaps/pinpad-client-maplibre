const { withInfoPlist } = require('@expo/config-plugins');

const withCustomInfoPlist = config => {
  return withInfoPlist(config, config => {
    // Set your custom UTExportedTypeDeclarations.
    config.modResults.UTExportedTypeDeclarations = [
      {
        UTTypeIdentifier: 'com.example.drift',
        UTTypeConformsTo: ['public.zip-archive'],
        UTTypeDescription: 'Drift File Format',
        UTTypeTagSpecification: {
          'public.filename-extension': ['drift'],
          'public.mime-type': 'application/zip',
        },
      },
    ];
    return config;
  });
};

module.exports = withCustomInfoPlist;
