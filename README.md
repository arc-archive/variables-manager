[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/variables-manager.svg)](https://www.npmjs.com/package/@advanced-rest-client/variables-manager)

[![Build Status](https://travis-ci.org/advanced-rest-client/variables-manager.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/variables-manager)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/variables-manager)

## &lt;variables-manager&gt;

A manager for environments and variables.

Non UI element that manages variables state and handle storage.
It works with other elements consuming variables:

-   variables-editor
-   environment-selector
-   variables-evaluator
-   variables-consumer-mixin (used by variables consumers)

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/variables-manager
```

### In an html file

```html
<html>
  <head>
    <!-- PouchDB is not ES6 ready -->
    <script src="../../../pouchdb/dist/pouchdb.js"></script>
    <script type="module">
      import './node_modules/@advanced-rest-client/variables-manager/variables-manager.js';
      import './node_modules/@advanced-rest-client/arc-models/variables-model.js';
    </script>
  </head>
  <body>
    <variables-model></variables-model>
    <variables-manager></variables-manager>
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from './node_modules/@polymer/polymer';
import './node_modules/@advanced-rest-client/variables-manager/variables-manager.js';
import './node_modules/@advanced-rest-client/arc-models/variables-model.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <variables-model></variables-model>
    <variables-manager environment="{{environment}}" variables="{{currentVariables}}"></variables-manager>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/variables-manager
cd api-url-editor
npm install
npm install -g polymer-cli
```

### Running the demo locally

```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/
```

### Running the tests
```sh
polymer test --npm
```
