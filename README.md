# diff-text

A web app for comparing two portions of text using [react-diff-viewer](https://github.com/praneshr/react-diff-viewer).

- [Live demo hosted by Netlify](https://diff-text.netlify.app/)

## Screenshot

![Screenshot](https://github.com/andygock/diff-text/blob/master/screenshots/diff-text-screenshot.png?raw=true)

## Features

- Supports drag and drop of files into the `textarea` via [react-dropzone-textarea](https://github.com/andygock/react-dropzone-textarea). Disclosure: I'm the author of the library.
- Supports [multiple spreadsheet formats](https://github.com/sheetjs/sheetjs#file-formats). Currently, it only reads the first worksheet for multi-sheet workbooks.

## Install and build

Install dependencies:

    yarn install

Run:

    yarn start

Build production ready static files to `dist/`:

    yarn build

## References

- [react-diff-viewer](https://github.com/praneshr/react-diff-viewer)
- [SheetJS](https://github.com/sheetjs/sheetjs)
- [Blueprint](https://blueprintjs.com/docs/)
