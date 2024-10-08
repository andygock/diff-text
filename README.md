# diff-text

A web app for comparing two portions of text using [react-diff-viewer-continued](https://aeolun.github.io/react-diff-viewer-continued/).

- [Live demo hosted on GitHub Pages](https://diff.gock.net/)

## Screenshot

![Screenshot](https://github.com/andygock/diff-text/blob/master/screenshots/diff-text-screenshot.png?raw=true)

## Features

- Supports drag and drop of files into the `textarea` via [react-dropzone-textarea](https://github.com/andygock/react-dropzone-textarea). Disclosure: I'm the author of the library.
- Supports [multiple spreadsheet formats](https://docs.sheetjs.com/docs/#supported-file-formats). Currently, it only reads the first worksheet for multi-sheet workbooks.

## Install and build

Install [pnpm](https://pnpm.io/)

    npm install -g pnpm

Install dependencies:

    pnpm install

Run:

    pnpm start

Build production ready static files to `dist/`:

    pnpm build

If required, use the following Netlify build command

    pnpm build || ( npm install pnpm && pnpm build )

## References

- [react-diff-viewer-continued](https://github.com/aeolun/react-diff-viewer-continued)
- [SheetJS](https://github.com/sheetjs/sheetjs)
