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
    <script type="module">
      import './node_modules/@advanced-rest-client/variables-manager/variables-manager.js';
      import './node_modules/@advanced-rest-client/arc-models/variables-model.js';
    </script>
  </head>
  <body>
    <variables-manager></variables-manager>
  </body>
</html>
```

### In a LitElement template

```javascript
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/variables-manager/variables-manager.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <variables-manager
      @environment-changed="${this._environmentHandler}"
      @variables-changed="${this._variablesHandler}"></variables-manager>
    `;
  }

  _environmentHandler(e) {
    this.currentEnvironment = e.target.environment; // or e.detail.value;
  }

  _environmentHandler(e) {
    this.currentVariables = e.target.variables; // or e.detail.value;
  }
}
customElements.define('sample-element', SampleElement);
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@advanced-rest-client/variables-manager/variables-manager.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <variables-manager environment="{{environment}}" variables="{{currentVariables}}"></variables-manager>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/variables-manager
cd variables-manager
npm install
```

### Running the demo locally

```sh
npm start
```

### Running the tests

```sh
npm test
```
