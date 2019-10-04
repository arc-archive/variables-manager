import { fixture, assert, aTimeout } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import { VariablesTestHelper } from './helper.js';
import * as sinon from 'sinon/pkg/sinon-esm.js';
import '../variables-manager.js';

/* eslint-disable require-atomic-updates */

describe('<variables-manager>', function() {
  async function basicFixture() {
    return (await fixture(`<variables-manager></variables-manager>`));
  }

  async function defaultFixture() {
    return (await fixture(`<variables-manager environment="default"></variables-manager>`));
  }

  async function testEnvFixture() {
    return (await fixture(`<variables-manager environment="test"></variables-manager>`));
  }

  async function sysDisabledEnvFixture() {
    return (await fixture(`<variables-manager sysvariablesdisabled></variables-manager>`));
  }

  function untilWarListChanged(element) {
    return new Promise((resolve) => {
      element.addEventListener('variables-list-changed', function clb(e) {
        element.removeEventListener('variables-list-changed', clb);
        resolve(e);
      });
    });
  }

  function untilInitialized(element) {
    return new Promise((resolve) => {
      element.addEventListener('initialized-changed', function clb() {
        element.removeEventListener('initialized-changed', clb);
        resolve();
      });
    });
  }

  describe('_envNameHandler()', () => {
    before(async function() {
      await VariablesTestHelper.addEnvs('default');
      await VariablesTestHelper.addVars([{
        _id: 'a',
        variable: 'a',
        value: 'a',
        environment: 'default'
      }, {
        _id: 'b',
        variable: 'b',
        value: 'b',
        environment: 'default'
      }]);
    });

    after( () => DataGenerator.destroyVariablesData());

    let element;
    beforeEach(async () => {
      element = await defaultFixture();
      await untilWarListChanged(element);
    });

    function fire(cancelable) {
      if (cancelable !== false) {
        cancelable = true;
      }
      const e = new CustomEvent('environment-current', {
        detail: {},
        bubbles: true,
        composed: true,
        cancelable
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Ignores non cancelable event', function() {
      const e = fire(false);
      assert.isFalse(e.defaultPrevented);
    });

    it('Event is canceled', function() {
      const e = fire();
      assert.isTrue(e.defaultPrevented);
    });

    it('Sets current environment', () => {
      const e = fire();
      assert.equal(e.detail.environment, 'default');
    });

    it('Sets variables list', () => {
      const e = fire();
      assert.typeOf(e.detail.variables, 'array');
      assert.lengthOf(e.detail.variables, 2);
    });

    it('Sets default environment', () => {
      element.environment = undefined;
      const e = fire();
      assert.equal(e.detail.environment, 'default');
    });
  });

  describe('_eventCancelled()', () => {
    let element;
    beforeEach(async () => {
      element = await defaultFixture();
      await untilWarListChanged(element);
    });

    it('Returns true when event is canceled', () => {
      const e = new CustomEvent('test', {
        cancelable: true
      });
      element._cancelEvent(e);
      const result = element._eventCancelled(e);
      assert.isTrue(result);
    });

    it('Returns true when event is cancelable', () => {
      const e = new CustomEvent('test');
      const result = element._eventCancelled(e);
      assert.isTrue(result);
    });

    it('Returns true when event is dispatched on current element', () => {
      const e = {
        cancelable: true,
        composedPath: function() {
          return [element];
        }
      };
      const result = element._eventCancelled(e);
      assert.isTrue(result);
    });

    it('Returns false otherwise', () => {
      const e = new CustomEvent('test', {
        cancelable: true
      });
      if (!e.composedPath) {
        e.composedPath = () => [];
      }
      document.body.dispatchEvent(e);
      const result = element._eventCancelled(e);
      assert.isFalse(result);
    });
  });

  describe('__environmentChanged()', () => {
    before(async function() {
      await VariablesTestHelper.addEnvs('test');
      await VariablesTestHelper.addVars([{
        _id: 'a',
        variable: 'a',
        value: 'a',
        environment: 'test'
      }, {
        _id: 'b',
        variable: 'b',
        value: 'b',
        environment: 'test'
      }]);
    });

    after(() => DataGenerator.destroyVariablesData());

    let element;
    beforeEach(async () => {
      element = await defaultFixture();
      await untilWarListChanged(element);
    });

    it('Returns a promise when no envitonment', () => {
      const result = element.__environmentChanged();
      assert.typeOf(result.then, 'function');
      return result;
    });

    it('Returns a promise when has argument', () => {
      const result = element.__environmentChanged('test');
      assert.typeOf(result.then, 'function');
      return result;
    });

    it('Dispatches selected-environment-changed event', () => {
      const spy = sinon.spy();
      element.addEventListener('selected-environment-changed', spy);
      const result = element.__environmentChanged('test');
      assert.isTrue(spy.called);
      return result;
    });

    it('Skips the event when _cancelEnvPropagation is set', () => {
      element._cancelEnvPropagation = true;
      const spy = sinon.spy();
      element.addEventListener('selected-environment-changed', spy);
      const result = element.__environmentChanged('test');
      assert.isFalse(spy.called);
      return result;
    });

    it('Initially clears _vars', () => {
      element._vars = [{}];
      const result = element.__environmentChanged('test');
      assert.isUndefined(element._vars);
      return result;
    });

    it('Initially clears _env', () => {
      element._env = {name: 'test'};
      const result = element.__environmentChanged('test');
      assert.isUndefined(element._env);
      return result;
    });

    it('Calls _readEnvObjectData()', () => {
      const spy = sinon.spy(element, '_readEnvObjectData');
      const result = element.__environmentChanged('test');
      assert.isTrue(spy.called);
      return result;
    });

    it('Calls _updateVariablesList()', () => {
      const spy = sinon.spy(element, '_updateVariablesList');
      const result = element.__environmentChanged('test');
      return result.then(() => {
        assert.isTrue(spy.called);
      });
    });

    it('Eventually sets _env', () => {
      return element.__environmentChanged('test')
      .then(() => {
        assert.typeOf(element._env, 'object');
      });
    });
  });

  describe('_dataImportHandler()', () => {
    let element;
    beforeEach(async () => {
      element = await defaultFixture();
      await untilWarListChanged(element);
    });

    it('Eventually calls _updateVariablesList()', async () => {
      element._dataImportHandler();
      const spy = sinon.spy(element, '_updateVariablesList');
      await aTimeout();
      assert.isTrue(spy.called);
    });
  });

  describe('_onDatabaseDestroy()', () => {
    let element;
    beforeEach(async () => {
      element = await defaultFixture();
      await untilWarListChanged(element);
    });

    function fire(datastore) {
      const e = new CustomEvent('datastore-destroyed', {
        detail: {
          datastore
        },
        bubbles: true,
        composed: true
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Do nothing when datastore is not set', async () => {
      fire();
      const spy = sinon.spy(element, '_updateVariablesList');
      await aTimeout();
      assert.isFalse(spy.called);
    });

    it('Calls _updateVariablesList when datastore is "variables"', async () => {
      fire('variables');
      const spy = sinon.spy(element, '_updateVariablesList');
      await aTimeout();
      assert.isTrue(spy.called);
    });

    it('Calls _updateVariablesList when datastore is "[variables]"', async () => {
      fire(['variables']);
      const spy = sinon.spy(element, '_updateVariablesList');
      await aTimeout();
      assert.isTrue(spy.called);
    });

    it('Calls _updateVariablesList when datastore is "variables-environments"', async () => {
      fire('variables-environments');
      const spy = sinon.spy(element, '_updateVariablesList');
      await aTimeout();
      assert.isTrue(spy.called);
    });

    it('Calls _updateVariablesList when datastore is "[variables-environments]"', async () => {
      fire(['variables-environments']);
      const spy = sinon.spy(element, '_updateVariablesList');
      await aTimeout();
      assert.isTrue(spy.called);
    });

    it('Calls _updateVariablesList when datastore is "all"', async () => {
      fire('all');
      const spy = sinon.spy(element, '_updateVariablesList');
      await aTimeout();
      assert.isTrue(spy.called);
    });

    it('Calls _updateVariablesList when datastore is "[all]"', async () => {
      fire(['all']);
      const spy = sinon.spy(element, '_updateVariablesList');
      await aTimeout();
      assert.isTrue(spy.called);
    });

    it('Ignores event for other data stores', async () => {
      fire('other');
      const spy = sinon.spy(element, '_updateVariablesList');
      await aTimeout();
      assert.isFalse(spy.called);
    });

    it('Sets default environment', () => {
      element.environment = 'test';
      fire('all');
      assert.equal(element.environment, 'default');
    });
  });

  describe('_computeSysVars()', () => {
    let element;
    let sysVars;
    beforeEach(async () => {
      element = await defaultFixture();
      await untilWarListChanged(element);
      sysVars = {
        a: 'b',
        c: 'd'
      };
    });

    it('Returns undefined when no argument', () => {
      const result = element._computeSysVars();
      assert.isUndefined(result);
    });

    it('Returns undefined when system variables are disabled', () => {
      const result = element._computeSysVars({}, true);
      assert.isUndefined(result);
    });

    it('Returns undefined when not an object', () => {
      const result = element._computeSysVars('test');
      assert.isUndefined(result);
    });

    it('Computes an array with 2 elements', () => {
      const result = element._computeSysVars(sysVars);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 2);
    });

    it('Has all keys and values', () => {
      const result = element._computeSysVars(sysVars);
      for (let i = 0; i < result.length; i++) {
        const _var = result[i];
        assert.isTrue(_var.variable in sysVars, 'Variable exists');
        assert.equal(_var.value, sysVars[_var.variable], 'Value exists');
      }
    });

    it('"sysVar" property is set', () => {
      const result = element._computeSysVars(sysVars);
      for (let i = 0; i < result.length; i++) {
        assert.isTrue(result[i].sysVar);
      }
    });

    it('Belongs to all environments', () => {
      const result = element._computeSysVars(sysVars);
      for (let i = 0; i < result.length; i++) {
        assert.equal(result[i].environment, '*');
      }
    });

    it('Variable is enabled', () => {
      const result = element._computeSysVars(sysVars);
      for (let i = 0; i < result.length; i++) {
        assert.isTrue(result[i].enabled);
      }
    });
  });

  describe('listAllVariables()', () => {
    before(async () => {
      await VariablesTestHelper.addEnvs('default');
      await VariablesTestHelper.addVars([{
        _id: 'a',
        variable: 'a',
        value: 'a',
        environment: 'default'
      }, {
        _id: 'b',
        variable: 'b',
        value: 'b',
        environment: 'default'
      }]);
    });

    after( () => DataGenerator.destroyVariablesData());

    let element;
    let sysVars;
    let inMemVariables;
    beforeEach(async () => {
      element = await defaultFixture();
      sysVars = {
        a: 'b',
        c: 'd'
      };
      element.systemVariables = sysVars;
      inMemVariables = [{
        variable: 'v1',
        value: 'value1',
        enabled: true,
        sysVar: false,
        environment: '*'
      }, {
        variable: 'v2',
        value: 'value2',
        enabled: true,
        sysVar: false,
        environment: '*'
      }];
      await untilWarListChanged(element);
    });

    it('Returns an array', () => {
      const result = element.listAllVariables();
      assert.typeOf(result, 'array');
    });

    it('Array has 2 application variables', () => {
      const result = element.listAllVariables();
      const vars = result.filter((item) => !item.sysVar);
      assert.lengthOf(vars, 2);
    });

    it('Array has 2 system variables', () => {
      const result = element.listAllVariables();
      const vars = result.filter((item) => item.sysVar);
      assert.lengthOf(vars, 2);
    });

    it('Adds in memory variables', () => {
      element.inMemVariables = inMemVariables;
      const result = element.listAllVariables();
      const vars = result.filter((item) => !item.sysVar);
      assert.lengthOf(vars, 4);
    });

    it('In memory variable overrides application variable', () => {
      inMemVariables.push({
        variable: 'a',
        value: 'test',
        enabled: true,
        sysVar: false,
        environment: '*'
      });
      element.inMemVariables = inMemVariables;
      const result = element.listAllVariables();
      const item = result.find((item) => item.variable === 'a');
      assert.equal(item.value, 'test');
    });
  });

  describe('_varStoreActionHandler()', () => {
    before(async () => {
      await VariablesTestHelper.addEnvs('default');
      await VariablesTestHelper.addVars([{
        _id: 'existing',
        variable: 'existing',
        value: 'value',
        environment: 'default'
      }]);
    });

    after( () => DataGenerator.destroyVariablesData());

    let element;
    beforeEach(async () => {
      element = await defaultFixture();
      await untilWarListChanged(element);
    });

    it('Ignores the event when cancelled', () => {
      element._varStoreActionHandler({
        defaultPrevented: true
      });
      // no error
    });

    function fire(variable, value) {
      const e = new CustomEvent('variable-store-action', {
        detail: {
          variable,
          value
        },
        bubbles: true,
        cancelable: true
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Cancels the event', () => {
      const e = fire('v1', 'value');
      assert.isTrue(e.defaultPrevented);
      return e.detail.result;
    });

    it('Detail has promise', () => {
      const e = fire('v2', 'value');
      assert.typeOf(e.detail.result.then, 'function');
      return e.detail.result;
    });

    it('Results in variable insert result', () => {
      const e = fire('v3', 'value');
      return e.detail.result
      .then((result) => {
        assert.typeOf(result._id, 'string');
        assert.typeOf(result._rev, 'string');
      });
    });

    it('Updates value on existing variable', () => {
      const e = fire('existing', 'newvalue');
      return e.detail.result
      .then((result) => {
        assert.equal(result._id, 'existing');
        assert.equal(result._rev.indexOf('2-'), 0);
      });
    });
  });

  describe('_variableIndexByName()', () => {
    before(async () => {
      await VariablesTestHelper.addEnvs('default');
      await VariablesTestHelper.addVars([{
        _id: 'v1',
        variable: 'v1',
        value: 'value',
        environment: 'default'
      }]);
    });

    after( () => DataGenerator.destroyVariablesData());

    let element;
    beforeEach(async () => {
      element = await defaultFixture();
      await untilWarListChanged(element);
    });

    it('Returns -1 when vars are not set', () => {
      element._vars = undefined;
      const result = element._variableIndexByName('v1');
      assert.equal(result, -1);
    });

    it('Returns -1 when var not found', () => {
      const result = element._variableIndexByName('v2');
      assert.equal(result, -1);
    });

    it('Returns index of the variable', () => {
      const result = element._variableIndexByName('v1');
      assert.equal(result, 0);
    });
  });

  describe('_updateVariable()', () => {
    after(() => DataGenerator.destroyVariablesData());

    let element;
    let update;
    beforeEach(async () => {
      element = await defaultFixture();
      await untilWarListChanged(element);
      update = {
        variable: 'v1',
        value: 'value',
        environment: 'default'
      };
    });

    it('Quietly exists when event not handled', () => {
      element.addEventListener('variable-updated', function f(e) {
        element.removeEventListener('variable-updated', f);
        e.stopPropagation();
      });
      update._id = 'v1';
      element._updateVariable(update);
    });

    it('calls updateVariable() on the model', async () => {
      update._id = 'v1';
      const spy = sinon.spy(element._model, 'updateVariable');
      await element._updateVariable(update);
      assert.isTrue(spy.called);
    });

    it('returns insert result', async () => {
      update._id = 'v1';
      const result = await element._updateVariable(update);
      assert.typeOf(result._id, 'string');
      assert.typeOf(result._rev, 'string');
    });
  });

  describe('_varUpdateActionHandler()', () => {
    before(async () => {
      await VariablesTestHelper.addEnvs('default');
      await VariablesTestHelper.addVars([{
        _id: 'existing',
        variable: 'existing',
        value: 'value',
        environment: 'default'
      }]);
    });

    after( () => DataGenerator.destroyVariablesData());

    let element;
    beforeEach(async () => {
      element = await defaultFixture();
      await untilWarListChanged(element);
    });

    function fire(variable, value) {
      const e = new CustomEvent('variable-update-action', {
        detail: {
          variable,
          value
        },
        bubbles: true,
        cancelable: true
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Cancels the event', () => {
      const e = fire('v1', 'value');
      assert.isTrue(e.defaultPrevented);
    });

    it('Sets inMemVariables array', () => {
      fire('v1', 'value');
      assert.typeOf(element.inMemVariables, 'array');
      assert.lengthOf(element.inMemVariables, 1);
    });

    it('Updates existing value', () => {
      element.inMemVariables = [{
        variable: 'v1',
        value: 'value',
        enabled: true,
        sysVar: false,
        environment: '*'
      }];
      fire('v1', 'other');
      assert.lengthOf(element.inMemVariables, 1);
      assert.equal(element.inMemVariables[0].value, 'other');
    });

    it('Notifies variables list changed', () => {
      const spy = sinon.spy(element, '_notifyVarsListChanged');
      fire('v1', 'other');
      assert.isTrue(spy.called);
    });
  });

  describe('Variables tests', function() {
    let vars;
    before(async () => {
      vars = [{
        _id: 'a',
        variable: 'a',
        value: 'a',
        environment: 'test'
      }, {
        _id: 'b',
        variable: 'b',
        value: 'b',
        environment: 'test'
      }];
      await VariablesTestHelper.addEnvs('test');
      await VariablesTestHelper.addVars(vars);
    });

    after(() => DataGenerator.destroyVariablesData());

    describe('Variable updated', function() {
      let element;
      beforeEach( async () => {
        element = await testEnvFixture();
        await untilInitialized(element);
      });

      it('Ignores variable for another environment', function() {
        const item = Object.assign({}, vars[0]);
        item.environment = 'other';
        item.variable = 'x';
        document.body.dispatchEvent(new CustomEvent('variable-updated', {
          bubbles: true,
          detail: {
            value: item
          }
        }));
        assert.equal(element.variables[0].variable, 'a');
      });

      it('Updates existing variable', function() {
        const item = Object.assign({}, vars[0]);
        item.variable = 'x';
        document.body.dispatchEvent(new CustomEvent('variable-updated', {
          bubbles: true,
          detail: {
            value: item
          }
        }));
        assert.equal(element.variables[0].variable, 'x');
      });

      it('Adds new variable', function() {
        const item = {
          _id: 'c',
          variable: 'c',
          value: 'c',
          environment: 'test'
        };
        document.body.dispatchEvent(new CustomEvent('variable-updated', {
          bubbles: true,
          detail: {
            value: item
          }
        }));
        assert.deepEqual(element.variables[2], item);
      });
    });

    describe('Variable deleted', function() {
      let element;
      beforeEach( async () => {
        element = await testEnvFixture();
        await untilInitialized(element);
      });

      it('Ignores non existin variable', function() {
        document.body.dispatchEvent(new CustomEvent('variable-deleted', {
          bubbles: true,
          detail: {
            id: 'x'
          }
        }));
        assert.lengthOf(element.variables, 2);
      });

      it('Removes variable from list', function() {
        document.body.dispatchEvent(new CustomEvent('variable-deleted', {
          bubbles: true,
          detail: {
            id: 'a'
          }
        }));
        assert.lengthOf(element.variables, 1);
        assert.equal(element.variables[0].variable, 'b');
      });
    });
  });

  describe('System variables tests', function() {
    describe('Basic computation', () => {
      let element;
      let sysVars;
      beforeEach(() => {
        sysVars = {
          s1: 'v1',
          s2: 'v2',
          s3: 'v3'
        };
      });

      after(() => DataGenerator.destroyVariablesData());

      it('Computes _sysVars', async () => {
        element = await testEnvFixture();
        await untilInitialized(element);
        element.systemVariables = sysVars;
        assert.typeOf(element._sysVars, 'array');
        assert.lengthOf(element._sysVars, 3);
      });

      it('sysVar is set on computed items', async () => {
        element = await testEnvFixture();
        await untilInitialized(element);
        element.systemVariables = sysVars;
        element._sysVars.forEach((item) => {
          assert.isTrue(item.sysVar);
        });
      });

      it('Sys variables applies to all environments', async () => {
        element = await testEnvFixture();
        await untilInitialized(element);
        element.systemVariables = sysVars;
        element._sysVars.forEach((item) => {
          assert.equal(item.environment, '*');
        });
      });

      it('Does not compute variables if disabled', async () => {
        element = await sysDisabledEnvFixture();
        await untilInitialized(element);
        element.systemVariables = sysVars;
        assert.isUndefined(element._sysVars);
      });

      it('Dispaches vars change event when changing system variables', async () => {
        element = await testEnvFixture();
        await untilInitialized(element);
        element.systemVariables = sysVars;
        const e = await untilWarListChanged(element);
        assert.typeOf(e.detail.value, 'array');
        assert.lengthOf(e.detail.value, 3);
      });
    });

    describe('Combination with app variables', () => {
      let vars;
      before(async function() {
        vars = [{
          _id: 'a',
          variable: 'a',
          value: 'a',
          environment: 'test'
        }, {
          _id: 'b',
          variable: 'b',
          value: 'b',
          environment: 'test'
        }];
        await VariablesTestHelper.addEnvs('test');
        await VariablesTestHelper.addVars(vars);
      });

      after(() => DataGenerator.destroyVariablesData());

      let element;
      beforeEach(async () => {
        element = await testEnvFixture();
        element.systemVariables = {
          s1: 'v1',
          s2: 'v2',
          s3: 'v3'
        };
        await untilInitialized(element);
      });

      it('Comnputes combined list of variables', () => {
        const vars = element.listAllVariables();
        assert.typeOf(vars, 'array');
        assert.lengthOf(vars, 5);
      });
    });
  });

  describe('Initialization', function() {
    let listFn;
    const noop = () => {};
    before(async () => {
      listFn = function(e) {
        if (e.defaultPrevented) {
          return;
        }
        e.preventDefault();
        e.detail.result = Promise.resolve();
      };
      window.addEventListener('environment-list-variables', listFn);
      await VariablesTestHelper.addEnvs('test');
    });

    after(async () => {
      window.removeEventListener('environment-list-variables', listFn);
      await DataGenerator.destroyVariablesData();
    });

    it('Dispatches environment-current', async () => {
      let called = false;
      window.addEventListener('environment-current', function f() {
        window.removeEventListener('environment-current', f);
        called = true;
      });
      const element = await basicFixture();
      element._updateVariablesList = noop;
      assert.isTrue(called);
    });

    it('Sets environment from the event', async () => {
      window.addEventListener('environment-current', function f(e) {
        window.removeEventListener('environment-current', f);
        e.preventDefault();
        e.detail.environment = 'default';
      });
      const element = await basicFixture();
      element._updateVariablesList = noop;
      assert.equal(element.environment, 'default');
    });

    it('Sets memory variables from the event', async () => {
      const memVars = [{ variable: 'test' }];
      window.addEventListener('environment-current', function f(e) {
        window.removeEventListener('environment-current', f);
        e.preventDefault();
        e.detail.environment = 'default';
        e.detail.inMemVariables = memVars;
      });
      const element = await basicFixture();
      element._updateVariablesList = noop;
      assert.deepEqual(element.inMemVariables, memVars);
    });

    it('Dispatches selected-environment-changed event', async () => {
      window.addEventListener('environment-current', function f(e) {
        window.removeEventListener('environment-current', f);
        e.preventDefault();
        e.detail.environment = 'default';
      });
      const spy = sinon.spy();
      window.addEventListener('environment-current', spy);
      const element = await basicFixture();
      element._updateVariablesList = noop;
      assert.isTrue(spy.called);
    });

    it('Sets _env for non default environment', async () => {
      const element = await testEnvFixture();
      await untilInitialized(element);
      assert.typeOf(element._env, 'object');
    });
  });

  describe('a11y', () => {
    it('adds aria-hidden', async () => {
      const element = await basicFixture();
      assert.equal(element.getAttribute('aria-hidden'), 'true');
    });

    it('is accessible', async () => {
      const element = await basicFixture();
      await assert.isAccessible(element);
    });
  });
});
