/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { LitElement, html, css } from 'lit-element';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';
import '@advanced-rest-client/arc-models/variables-model.js';
/**
 * A manager for environments and variables. Non UI element that manages variables
 * state and handle data storage.
 *
 * ### Example
 *
 * ```html
 * <variables-manager></variables-manager>
 * ```
 *
 * ## New in version 2
 *
 * - PouchDB is optional dependency. Add your own version of PouchDB to use the
 * component.
 * - Update/Delete actions has been moved to `arc-models/variables-model`
 *
 * @memberof LogicElements
 * @customElement
 * @demo demo/index.html
 * @appliesMixin EventsTargetMixin
 */
class VariablesManager extends EventsTargetMixin(LitElement) {
  static get styles() {
    return css`:host { display: none !important; }`;
  }

  render() {
    let target = this.eventsTarget;
    if (target === window) {
      target = this;
    }
    return html`<variables-model .eventsTarget="${target}"></variables-model>`;
  }

  static get properties() {
    return {
      /**
       * Currently loaded environment.
       */
      environment: { type: String },
      /**
       * Selected environment object from the data store if different than
       * "default".
       */
      _env: { type: Object },
      _vars: { type: Array },
      /**
       * List of variables associated with current `environment`.
       */
      _variables: { type: Array },
      /**
       * List of variables that overrides all existing variables
       * (system or app) and exists only in memory.
       */
      inMemVariables: { type: Array },
      /**
       * When set it includes system variables into the list of variables.
       * This should be a map of system variables.
       * @type {Object}
       */
      systemVariables: { type: Object },

      _sysVars: { type: Array },
      /**
       * A flag to determine of the component is fully initialized.
       */
      _initialized: { type: Boolean },
      /**
       * When set the `_sysVars` will not be computed and therefore included
       * into variables list.
       */
      sysVariablesDisabled: { type: Boolean },
      /**
       * When set the application (local) defined variables are not included.
       */
      appVariablesDisabled: { type: Boolean }
    };
  }

  get environment() {
    return this._environment;
  }

  set environment(value) {
    const old = this._environment;
    if (old === value) {
      return;
    }
    this._environment = value;
    this._environmentChanged(value);
  }

  get _env() {
    return this.__env;
  }

  set _env(value) {
    const old = this.__env;
    if (old === value) {
      return;
    }
    this.__env = value;
  }

  get _vars() {
    return this.__vars;
  }

  set _vars(value) {
    const old = this.__vars;
    if (old === value) {
      return;
    }
    this.__vars = value;
    this._variables = this._computeAppVars(value, this.appVariablesDisabled);
  }

  get variables() {
    return this._variables;
  }

  get _variables() {
    return this.__variables;
  }

  set _variables(value) {
    const old = this.__variables;
    if (old === value) {
      return;
    }
    this.__variables = value;
    this._appVarsChanged(value);
  }

  get initialized() {
    return this._initialized;
  }

  get _initialized() {
    return this.__initialized;
  }

  set _initialized(value) {
    const old = this.__initialized;
    if (old === value) {
      return;
    }
    this.__initialized = value;
    this.dispatchEvent(new CustomEvent('initialized-changed', {
      detail: {
        value
      }
    }));
  }

  get systemVariables() {
    return this._systemVariables;
  }

  set systemVariables(value) {
    const old = this._systemVariables;
    if (old === value) {
      return;
    }
    this._systemVariables = value;
    this._sysVars = this._computeSysVars(value, this.sysVariablesDisabled);
  }

  get sysVariablesDisabled() {
    return this._sysVariablesDisabled;
  }

  set sysVariablesDisabled(value) {
    const old = this._sysVariablesDisabled;
    if (old === value) {
      return;
    }
    this._sysVariablesDisabled = value;
    this._sysVars = this._computeSysVars(this.systemVariables, value);
  }

  get _sysVars() {
    return this.__sysVars;
  }

  set _sysVars(value) {
    const old = this.__sysVars;
    if (value === old) {
      return;
    }
    this.__sysVars = value;
    this._sysVarsChanged(value);
  }

  get _model() {
    return this.shadowRoot.querySelector('variables-model');
  }

  constructor() {
    super();
    this._envChnageHandler = this._envChnageHandler.bind(this);
    this._envUpdateHandler = this._envUpdateHandler.bind(this);
    this._envDeleteHandler = this._envDeleteHandler.bind(this);
    this._varUpdateHandler = this._varUpdateHandler.bind(this);
    this._varDeleteHandler = this._varDeleteHandler.bind(this);
    this._dataImportHandler = this._dataImportHandler.bind(this);
    this._varStoreActionHandler = this._varStoreActionHandler.bind(this);
    this._varUpdateActionHandler = this._varUpdateActionHandler.bind(this);
    this._envNameHandler = this._envNameHandler.bind(this);
    this._onDatabaseDestroy = this._onDatabaseDestroy.bind(this);
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.setAttribute('aria-hidden', 'true');
    this._initialize();
  }

  _attachListeners(node) {
    node.addEventListener('selected-environment-changed', this._envChnageHandler);
    node.addEventListener('environment-current', this._envNameHandler);
    node.addEventListener('environment-updated', this._envUpdateHandler);
    node.addEventListener('environment-deleted', this._envDeleteHandler);
    node.addEventListener('variable-updated', this._varUpdateHandler);
    node.addEventListener('variable-deleted', this._varDeleteHandler);
    node.addEventListener('data-imported', this._dataImportHandler);
    node.addEventListener('variable-store-action', this._varStoreActionHandler);
    node.addEventListener('variable-update-action', this._varUpdateActionHandler);
    node.addEventListener('datastore-destroyed', this._onDatabaseDestroy);
  }

  _detachListeners(node) {
    node.removeEventListener('selected-environment-changed', this._envChnageHandler);
    node.removeEventListener('environment-current', this._envNameHandler);
    node.removeEventListener('environment-updated', this._envUpdateHandler);
    node.removeEventListener('environment-deleted', this._envDeleteHandler);
    node.removeEventListener('variable-updated', this._varUpdateHandler);
    node.removeEventListener('variable-deleted', this._varDeleteHandler);
    node.removeEventListener('data-imported', this._dataImportHandler);
    node.removeEventListener('variable-store-action', this._varStoreActionHandler);
    node.removeEventListener('variable-update-action', this._varUpdateActionHandler);
    node.removeEventListener('datastore-destroyed', this._onDatabaseDestroy);
  }
  /**
   * Initializes the element.
   * It dispatches `environment-current` to ask other managers in the DOM whether
   * an environment is already selected. If other manager respond then it sets the same
   * environment. Otherwise it sets `default` environment.
   */
  _initialize() {
    if (!this.environment) {
      const e = new CustomEvent('environment-current', {
        cancelable: true,
        composed: true,
        bubbles: true,
        detail: {}
      });
      this.dispatchEvent(e);
      let name;
      let inMem;
      if (e.defaultPrevented) {
        name = e.detail.environment;
        inMem = e.detail.inMemVariables;
      } else {
        name = 'default';
      }
      this.environment = name;
      this.inMemVariables = inMem;
    } else {
      this._environmentChanged(this.environment);
    }
  }
  /**
   * Computes list of variables object for system variables
   * @param {Object} systemVariables Key - value pairs of system variables
   * @param {Boolean} sysVariablesDisabled If true it always returns `false`.
   * @return {Array<Object>|undefined} List of variables representing system variables.
   */
  _computeSysVars(systemVariables, sysVariablesDisabled) {
    if (!systemVariables || sysVariablesDisabled) {
      return;
    }
    if (typeof systemVariables !== 'object') {
      return;
    }
    const names = Object.keys(systemVariables);
    const value = names.map(function(env) {
      return {
        variable: env,
        value: systemVariables[env],
        enabled: true,
        environment: '*',
        sysVar: true
      };
    });
    return value;
  }
  /**
   * Handler for `environment-current` dispatched by managers to ask
   * for current environment.
   * @param {CustomEvent} e
   */
  _envNameHandler(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    this._cancelEvent(e);
    e.detail.environment = this.environment || 'default';
    e.detail.variables = this.listAllVariables();
    e.detail.inMemVariables = this.inMemVariables;
  }
  /**
   * Handler for the `environment` property change.
   *
   * Fires a `selected-environment-changed` with a debouncer set to next render
   * frame.
   */
  _environmentChanged() {
    if (this._envChangeDebouncer) {
      return;
    }
    this._envChangeDebouncer = true;
    setTimeout(() => {
      this._envChangeDebouncer = false;
      this.__environmentChanged(this.environment);
    });
  }
  /**
   * Handler for the `environment` property change.
   *
   * Fires a `selected-environment-changed` custom event and updates list of variables
   * in the environment.
   *
   * @param {String} environment
   * @return {Promise}
   */
  async __environmentChanged(environment) {
    this._vars = undefined;
    this._env = undefined;
    if (!this._cancelEnvPropagation) {
      this.dispatchEvent(new CustomEvent('selected-environment-changed', {
        composed: true,
        bubbles: true,
        detail: {
          value: environment
        }
      }));
    }
    if (!environment) {
      return Promise.resolve();
    }
    let obj;
    try {
      obj = await this._readEnvObjectData(environment);
    } catch (cause) {
      this._handleException(cause);
    }
    this._env = obj;
    await this._updateVariablesList();
    if (!this._initialized) {
      this._initialized = true;
    }
  }
  /**
   * Reads environment object from the data stopre if different than `default`.
   *
   * @param {String} environment Environment value.
   * @return {Promise}
   */
  async _readEnvObjectData(environment) {
    if (!environment || environment === 'default') {
      return Promise.resolve();
    }
    const model = this._model;
    const list = await model.listEnvironments();
    if (!list || !list.length) {
      return;
    }
    return list.find((item) => item.name === environment);
  }
  /**
   * Lists app, sys and in mem variables into single array.
   * @return {Array<Object>} List of all variables.
   */
  listAllVariables() {
    const variables = this.variables;
    const memVariables = this.inMemVariables;
    const sysVars = this._sysVars;

    let result = [];
    const names = [];
    if (!this.appVariablesDisabled && variables && variables.length) {
      variables.forEach((item) => {
        names.push(item.variable);
        result.push(Object.assign({}, item));
      });
    }
    if (memVariables) {
      for (let i = 0, len = memVariables.length; i < len; i++) {
        const item = Object.assign({}, memVariables[i]);
        if (names.indexOf(item.variable) !== -1) {
          for (let j = 0, resLen = result.length; j < resLen; j++) {
            if (result[j].variable === item.variable) {
              result[j] = item;
              break;
            }
          }
        } else {
          result.push(item);
        }
      }
    }
    if (sysVars && sysVars.length) {
      result = result.concat(sysVars);
    }
    return result;
  }
  /**
   * Combines both app variables and in memory variables
   * and informs listeners about the change.
   */
  _notifyVarsListChanged() {
    this.dispatchEvent(new CustomEvent('variables-list-changed', {
      composed: true,
      bubbles: true,
      detail: {
        value: this.listAllVariables(),
        environment: this.environment || 'default'
      }
    }));
  }
  /**
   * Updates the list of variables for current environment.
   *
   * This task is asynchronus.
   * @return {Promise} Resolved promise with the list of variables for the
   * environment.
   */
  async _updateVariablesList() {
    const environment = this.environment || 'default';
    const model = this._model;
    try {
      const variables = (await  model.listVariables(environment) || []);
      if (environment !== this.environment) {
        // In some cases (changing environment right after initialization)
        // this may actually happen. Especially on slow IE.
        return;
      }
      this._vars = variables;
    } catch (cause) {
      this._handleException(cause);
      this._vars = [];
    }
    this._notifyVarsListChanged();
  }
  /**
   * Handles exceptions when occur by logging them to the console and
   * sending an analytics report.
   *
   * @param {Error} cause An error object with description.
   */
  _handleException(cause) {
    this.dispatchEvent(new CustomEvent('send-analytics', {
      composed: true,
      bubbles: true,
      detail: {
        type: 'exception',
        description: 'Listing environmants ' + cause.message,
        fatal: false
      }
    }));
  }
  /**
   * A handler for the `selected-environment-changed` custom event.
   * Updates the `environment` property if the event was sent by other elemenet
   * than `this`.
   *
   * @param {CustomEvent} e
   */
  _envChnageHandler(e) {
    if (e.composedPath()[0] === this) {
      return;
    }
    this._cancelEnvPropagation = true;
    this.environment = e.detail.value;
    this._cancelEnvPropagation = false;
  }
  /**
   * Handler for the `data-imported` custom event. Refreshes list of environmants
   * and variables.
   */
  _dataImportHandler() {
    setTimeout(() => this._updateVariablesList());
  }

  /**
   * Handler for the `datastore-destroyed` custom event.
   * @param {CustomEvent} e
   */
  _onDatabaseDestroy(e) {
    let { datastore } = e.detail;
    if (!datastore || !datastore.length) {
      return;
    }
    if (typeof datastore === 'string') {
      datastore = [datastore];
    }
    if (datastore.indexOf('variables') === -1 &&
      datastore.indexOf('variables-environments') === -1 &&
      datastore[0] !== 'all') {
      return;
    }
    if (this.environment !== 'default') {
      this.environment = 'default';
    } else {
      setTimeout(() => this._updateVariablesList());
    }
  }

  _eventCancelled(e) {
    const status = e.defaultPrevented || !e.cancelable;
    if (!status) {
      if (e.composedPath()[0] === this) {
        return true;
      }
    }
    return status;
  }

  _cancelEvent(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  /**
   * A handler for the `environment-updated` custom event.
   * Updates the environment in the data store.
   *
   * The `environment-updated` custom event should be cancellable or the event
   * won't be handled at all.
   *
   @param {CustomEvent} e
   */
  _envUpdateHandler(e) {
    if (e.cancelable) {
      return;
    }
    const env = e.detail.value;
    if (!this._env || this._env._id !== env._id) {
      return;
    }
    this._env = env;
    if (this.environment !== env.name) {
      this.environment = env.name;
    }
  }
  /**
   * A handler for the `environment-deleted` custom event.
   * If deleted environment is current environment then it sets environment
   * to `default`.
   *
   * @param {CustomEvent} e
   */
  _envDeleteHandler(e) {
    if (e.cancelable) {
      return;
    }
    if (!this._env || this._env._id !== e.detail.id) {
      return;
    }
    this._env = undefined;
    this.environment = 'default';
  }
  /**
   * A handler for the `variable-updated` custom event.
   * Updates the variable in the variables list if the environment name match.
   * @param {CustomEvent} e
   */
  _varUpdateHandler(e) {
    if (!this._eventCancelled(e)) {
      return;
    }
    const variable = e.detail.value;
    if (variable.environment !== this.environment) {
      return;
    }
    const vars = this._vars;
    if (!vars) {
      this._vars = [variable];
      return;
    }
    const index = vars.findIndex((item) => item._id === variable._id);
    if (~index) {
      vars[index] = variable;
    } else {
      vars[vars.length] = variable;
    }
    this._vars = [...vars];
  }
  /**
   * Removes the valiable from the lsit of variables if the variable is
   * in the list.
   *
   * @param {Event} e
   */
  _varDeleteHandler(e) {
    if (e.cancelable || e.defaultPrevented) {
      return;
    }
    if (this._vars) {
      const id = e.detail.id;
      const index = this._vars.findIndex((item) => item._id === id);
      if (~index) {
        const vars = this._vars;
        vars.splice(index, 1);
        this._vars = [...vars];
      }
    }
  }
  /**
   * A handler for `variable-store-action` dispatched by request actions logic.
   * Creates / updates a variable with new data.
   * @param {CustomEvent} e
   * @return {Promise}
   */
  _varStoreActionHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { variable, value } = e.detail;
    const index = this._variableIndexByName(variable);
    let obj;
    if (index === -1) {
      obj = {
       variable,
       value,
       enabled: true,
       sysVar: false,
       environment: this.environment
     };
    } else {
      obj = this._vars[index];
      obj.value = value;
    }
    e.detail.result = this._updateVariable(obj);
    return e.detail.result;
  }
  /**
   * @param {String} name Variable name
   * @return {Number} Index of the variable in the variables list or -1.
   */
  _variableIndexByName(name) {
    if (!this._vars) {
      return -1;
    }
    return this._vars.findIndex((item) => item.variable === name);
  }
  /**
   * Dispatches variable updated custom event to the model.
   * @param {Object} value Variable to update
   * @return {Promise}
   */
  async _updateVariable(value) {
    return await this._model.updateVariable(value);
  }
  /**
   * In memory variable change - without storing it to the store.
   * @param {CustomEvent} e
   */
  _varUpdateActionHandler(e) {
    if (!e.defaultPrevented) {
      e.preventDefault();
    }
    const vars = this.inMemVariables || [];
    const { variable, value } = e.detail;
    const index = vars.findIndex((item) => item.variable === variable);
    let obj;
    if (index === -1) {
      obj = {
        variable,
        value,
        enabled: true,
        sysVar: false,
        environment: '*'
      };
      vars[vars.length] = obj;
    } else {
      vars[index].value = value;
    }
    this.inMemVariables = [...vars];
    this._notifyVarsListChanged();
  }

  _sysVarsChanged() {
    if (!this.initialized) {
      return;
    }
    setTimeout(() => this._notifyVarsListChanged());
  }

  _computeAppVars(value, appVariablesDisabled) {
    if (appVariablesDisabled) {
      return;
    }
    return value;
  }

  _appVarsChanged() {
    if (!this.initialized) {
      return;
    }
    setTimeout(() => this._notifyVarsListChanged());
  }
  /**
   * Fired when selected environment has changed.
   * This event is not fired if the change has been causes by the
   * `selected-environment-changed` fired by other element.
   *
   * @event selected-environment-changed
   * @param {String} value Name of the selected environment.
   */

  /**
   * Fired when the list of variables for current environment has been read
   * and set. UIs should update list of current varables from
   * this events.
   *
   * @event variables-list-changed
   * @param {Array} value Array of PouchDB items with `_id` and `_rev` that
   * should be present when updating the envitonment.
   * @param {String} environment Name of the environment the the variables
   * belongs to.
   */
  /**
   * Dispatched when store variable request action is handled.
   *
   * @event variable-updated
   * @param {Object} value Updated variable value.
   */
}
window.customElements.define('variables-manager', VariablesManager);
