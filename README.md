# Translation LIB

Node library to translate a language JSON into a list of languages ​​by Google API

## Development

Run `npm run start`. The library will automatically reload if you change any of the source files.

## Build

Run `npm run build` to build the library. The build artifacts will be stored in the `dist/` directory.

## Example

There is a JSON which can be used as example (`mocks/assets/i18n/en.json`). To test it, just run
`npm run translate:local`. To make it possible, you need to have built the library first (See Development or Build steps).

## Link

If you want to use it like a node dependency from another local project, run `npm run start` or `npm run build` to build the library and `npm link` to link it, and then, you will be able to use the library from anywhere locally. If you wish to check that the library was linked correctly, run the command `npm run translate:link`.

## Deploy

To deploy this library, run the following commands in the same order shown:

1. `npm run package`
2. `npm run deploy`

## Debug

For Visual Studio Code users, there is a file .vscode/launch.json already configured to for debugging locally. Before to execute it, set some breakpoints into src/index.ts file.
