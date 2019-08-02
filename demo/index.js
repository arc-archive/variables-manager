import { html } from 'lit-html';
import { ArcDemoPage } from '@advanced-rest-client/arc-demo-helper/ArcDemoPage.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/iron-form/iron-form.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-item/paper-item-body.js';
import '@polymer/paper-toast/paper-toast.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@advanced-rest-client/arc-icons/arc-icons.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@advanced-rest-client/arc-models/variables-model.js';
import '../variables-manager.js';
import './vars-consumer.js';

class ComponentDemo extends ArcDemoPage {
  constructor() {
    super();
    this._componentName = 'variables-manager';
    this._envHandler = this._envHandler.bind(this);
    this._envsHandler = this._envsHandler.bind(this);
    this._variablesHandler = this._variablesHandler.bind(this);
    this._selectEnv = this._selectEnv.bind(this);
    this._deleteEnv = this._deleteEnv.bind(this);
    this._editEnv = this._editEnv.bind(this);
    this._editEnvDialogClose = this._editEnvDialogClose.bind(this);
    this._addEnv = this._addEnv.bind(this);
    this._envUpdatedHandler = this._envUpdatedHandler.bind(this);
    this._addVar = this._addVar.bind(this);
    this._varUpdatedHandler = this._varUpdatedHandler.bind(this);
    this._delVar = this._delVar.bind(this);
    this._editVar = this._editVar.bind(this);
    this._editDialogClose = this._editDialogClose.bind(this);

    window.addEventListener('environment-updated', this._envUpdatedHandler);
    window.addEventListener('variable-updated', this._varUpdatedHandler);
  }

  get environment() {
    return this._environment;
  }

  set environment(value) {
    this._setObservableProperty('environment', value);
  }

  get environments() {
    return this._environments;
  }

  set environments(value) {
    this._setObservableProperty('environments', value);
  }

  get variables() {
    return this._variables;
  }

  set variables(value) {
    this._setObservableProperty('variables', value);
  }

  get envSelector() {
    return document.getElementById('envSelector');
  }

  _envHandler(e) {
    this.environment = e.detail.value;
  }

  _envsHandler(e) {
    this.environments = e.detail.value;
  }

  _variablesHandler(e) {
    this.variables = e.detail.value;
  }

  _selectEnv() {
    const env = this.envSelector.selected;
    this.selectEnvironment(env);
  }

  _deleteEnv() {
    const env = this.envSelector.selected;
    if (env === 'default') {
      document.getElementById('delDefault').opened = true;
      return;
    }
    const item = this.environments.find((i) => i.name === env);
    if (!item) {
      document.getElementById('programError').opened = true;
      return;
    }
    document.body.dispatchEvent(new CustomEvent('environment-deleted', {
      cancelable: true,
      bubbles: true,
      detail: {
        id: item._id
      }
    }));
  }

  _editEnv() {
    const env = this.envSelector.selected;
    if (env === 'default') {
      document.getElementById('editDefault').opened = true;
      return;
    }
    const item = this.environments.find((i) => i.name === env);
    if (!item) {
      document.getElementById('programError').opened = true;
      return;
    }
    this.editedEnv = item;
    document.getElementById('editEnvInput').value = item.name;
    document.getElementById('editEnvDialog').opened = true;
  }

  selectEnvironment(value) {
    document.body.dispatchEvent(new CustomEvent('selected-environment-changed', {
      cancelable: true,
      bubbles: true,
      detail: {
        value
      }
    }));
  }

  _editEnvDialogClose(e) {
    if (e.detail.canceled || !e.detail.confirmed) {
      this.editedEnv = undefined;
      return;
    }
    const env = Object.assign({}, this.editedEnv);
    this.editedEnv = undefined;
    env.name = document.getElementById('editEnvInput').value;
    document.body.dispatchEvent(new CustomEvent('environment-updated', {
      cancelable: true,
      bubbles: true,
      detail: {
        value: env
      }
    }));
  }

  _addEnv() {
    const name = document.getElementById('addInput').value;
    if (!name) {
      document.getElementById('noName').opened = true;
      return;
    }
    if (name === 'default') {
      document.getElementById('noDefault').opened = true;
      return;
    }
    document.body.dispatchEvent(new CustomEvent('environment-updated', {
      cancelable: true,
      bubbles: true,
      detail: {
        value: {
          name
        }
      }
    }));
  }

  _envUpdatedHandler(e) {
    if (e.cancelable) {
      return;
    }
    this.selectEnvironment(e.detail.value.name);
    document.getElementById('envUpdated').opened = true;
  }

  _addVar() {
    const name = document.getElementById('addVarInput').value;
    if (!name) {
      document.getElementById('noName').opened = true;
      return;
    }
    const value = document.getElementById('addVarValueInput').value;
    const item = {
      variable: name,
      environment: this.environment,
      value
    };
    document.body.dispatchEvent(new CustomEvent('variable-updated', {
      cancelable: true,
      bubbles: true,
      detail: {
        value: item
      }
    }));
  }

  _varUpdatedHandler(e) {
    if (e.cancelable) {
      return;
    }
    document.getElementById('varUpdated').opened = true;
  }

  _delVar(e) {
    const index = Number(e.target.dataset.index);
    const id = this.variables[index]._id;
    document.body.dispatchEvent(new CustomEvent('variable-deleted', {
      cancelable: true,
      bubbles: true,
      detail: {
        id
      }
    }));
  }

  _editVar(e) {
    const index = Number(e.target.dataset.index);
    const variable = this.variables[index];
    this.editedVar = variable;
    document.getElementById('editVarInput').value = variable.variable;
    document.getElementById('editVarValueInput').value = variable.value;
    document.getElementById('editVarDialog').opened = true;
  }

  _editDialogClose(e) {
    if (e.detail.canceled || !e.detail.confirmed) {
      this.editedVar = undefined;
      return;
    }
    const v = Object.assign({}, this.editedVar);
    this.editedVar = undefined;
    v.variable = document.getElementById('editVarInput').value;
    v.value = document.getElementById('editVarValueInput').value;
    document.body.dispatchEvent(new CustomEvent('variable-updated', {
      cancelable: true,
      bubbles: true,
      detail: {
        value: v
      }
    }));
  }

  contentTemplate() {
    const { environment, environments, variables } = this;
    const hasEnvironments = !!(environments && environments.length);
    const hasVariables = !!(variables && variables.length);
    return html`
    <variables-model></variables-model>
    <variables-manager></variables-manager>

    <vars-consumer
      @environment-changed="${this._envHandler}"
      @environments-changed="${this._envsHandler}"
      @variables-changed="${this._variablesHandler}"></vars-consumer>

    <section class="card">
      <h2>Current state</h2>
      <div class="item">
        <span class="label">Current environment:</span>
        <span class="value">${environment}</span>
      </div>

      <div class="item">
        <span class="label">Variables in the environment:</span>
        <span class="value">${(variables && variables.length) || 0} items</span>
      </div>
    </section>

    <section class="card">
      <h2>Environment options</h2>
      <div class="form-row">
        <paper-dropdown-menu name="name" label="Select environment">
          <paper-listbox slot="dropdown-content" attr-for-selected="value" .selected="${environment}" id="envSelector">
            <paper-item value="default">Default</paper-item>
            ${hasEnvironments ?
              environments.map((item) =>
                html`<paper-item value="${item.name}">${item.name}</paper-item>`) :
              undefined}
          </paper-listbox>
        </paper-dropdown-menu>
        <paper-button @click="${this._selectEnv}" title="Select global environment">Select</paper-button>
        <paper-button @click="${this._deleteEnv}" title="Delete selected environment">Delete</paper-button>
        <paper-button @click="${this._editEnv}" title="Edit selected environment">Edit</paper-button>
      </div>
      <div class="form-row margin">
        <paper-input name="name" label="Environment name" id="addInput"></paper-input>
        <paper-button @click="${this._addEnv}">Add new environment</paper-button>
      </div>
    </section>

    <section class="card">
      <h2>Add variable</h2>
      <div class="form-row margin">
        <paper-input name="name" label="Variable name" value="myVariable" id="addVarInput"></paper-input>
        <paper-input name="value" label="Variable body" value="variable value" id="addVarValueInput"></paper-input>
        <paper-button @click="${this._addVar}">Add new variable</paper-button>
      </div>
    </section>

    ${hasVariables ?
      html`<section class="card">
        <h2>Current variables</h2>
        ${variables.map((item, index) => html`<paper-item>
          <paper-item-body two-line>
            <div>${item.variable}</div>
            <div secondary="">${item.value}</div>
          </paper-item-body>
          <paper-icon-button data-index="${index}" @click="${this._delVar}" icon="arc:delete"></paper-icon-button>
          <paper-icon-button data-index="${index}" @click="${this._editVar}" icon="arc:edit"></paper-icon-button>
        </paper-item>`)}
      </section>` :
      undefined}

    <paper-dialog id="editVarDialog" modal @iron-overlay-closed="${this._editDialogClose}">
      <h2>Edit variable</h2>
      <div>
        <paper-input name="name" label="Variable name" id="editVarInput"></paper-input>
        <paper-input name="value" label="Variable body" id="editVarValueInput"></paper-input>
      </div>
      <div class="buttons">
        <paper-button dialog-dismiss>Cancel</paper-button>
        <paper-button dialog-confirm autofocus>Save</paper-button>
      </div>
    </paper-dialog>

    <paper-dialog id="editEnvDialog" modal @iron-overlay-closed="${this._editEnvDialogClose}">
      <h2>Edit variable</h2>
      <div>
        <paper-input name="name" label="Environment name" id="editEnvInput"></paper-input>
      </div>
      <div class="buttons">
        <paper-button dialog-dismiss>Cancel</paper-button>
        <paper-button dialog-confirm autofocus>Save</paper-button>
      </div>
    </paper-dialog>

    <paper-toast id="delDefault" class="error-toast" text="Default environment cannot be deleted"></paper-toast>
    <paper-toast id="editDefault" class="error-toast" text="Default environment cannot be edited"></paper-toast>
    <paper-toast id="programError" class="error-toast" text="This should not happen. It's an error!"></paper-toast>
    <paper-toast id="noName" class="error-toast" text="Name is required."></paper-toast>
    <paper-toast id="noDefault" class="error-toast" text="Name cannot be 'default'."></paper-toast>
    <paper-toast id="envUpdated" text="The environment has been updated"></paper-toast>
    <paper-toast id="varUpdated" text="The variable has been updated"></paper-toast>
    `;
  }
}
const instance = new ComponentDemo();
instance.render();
window.demo = instance;
