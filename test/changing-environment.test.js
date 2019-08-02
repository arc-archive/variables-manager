import { fixture, assert, aTimeout } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import { VariablesTestHelper } from './helper.js';
import sinon from 'sinon/pkg/sinon-esm.js';
import '../variables-manager.js';

describe('<variables-manager>', function() {
  async function basicFixture() {
    return (await fixture(`<variables-manager></variables-manager>`));
  }

  async function environmentFixture() {
    return (await fixture(`<variables-manager environment="test"></variables-manager>`));
  }

  function untilInitialized(element) {
    return new Promise((resolve) => {
      element.addEventListener('initialized-changed', function clb() {
        element.removeEventListener('initialized-changed', clb);
        resolve();
      });
    });
  }

  describe('Changing environment', function() {
    after(() => DataGenerator.destroyVariablesData());

    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('sets environment', function() {
      VariablesTestHelper.fire('selected-environment-changed', {
        value: 'test'
      });
      assert.equal(element.environment, 'test');
    });

    it('Should not fire selected-environment-changed', async () => {
      await aTimeout();
      const spy = sinon.spy();
      element.addEventListener('selected-environment-changed', spy);
      VariablesTestHelper.fire('selected-environment-changed', {
        value: 'test'
      });
      assert.isFalse(spy.called);
    });

    it('Dispatches variables-list-changed', function(done) {
      element.addEventListener('variables-list-changed', function f() {
        element.removeEventListener('variables-list-changed', f);
        done();
      });
      VariablesTestHelper.fire('selected-environment-changed', {
        value: 'test'
      });
    });
  });

  describe('Changing environment with values', function() {
    before(async () => {
      await VariablesTestHelper.addEnvs('test');
      const vars = [{
        variable: 'test',
        value: 'some variable',
        environment: 'test'
      }, {
        variable: 'test-2',
        value: 'some variable-2',
        environment: 'test-2'
      }];
      await VariablesTestHelper.addVars(vars);
    });

    after(() => DataGenerator.destroyVariablesData());

    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('The variables-list-changed returns one item', function(done) {
      let called = false;
      element.addEventListener('variables-list-changed', function(e) {
        if (called) {
          return;
        }
        if (!e.detail.value || !e.detail.value.length) {
          return;
        }
        called = true;
        assert.lengthOf(e.detail.value, 1);
        done();
      });
      VariablesTestHelper.fire('selected-environment-changed', {
        value: 'test'
      });
    });

    it('The variables-list-changed event has stored value', function(done) {
      let called = false;
      element.addEventListener('variables-list-changed', function(e) {
        if (called) {
          return;
        }
        if (!e.detail.value || !e.detail.value.length) {
          return;
        }
        called = true;
        const value = e.detail.value[0];
        assert.equal(value.variable, 'test');
        assert.equal(value.value, 'some variable');
        done();
      });
      VariablesTestHelper.fire('selected-environment-changed', {
        value: 'test'
      });
    });
  });

  describe('environment-deleted', function() {
    let ids;
    before(async () => {
      const result = await VariablesTestHelper.addEnvs(['test', 'other']);
      ids = result.map((item) => item.id);
    });

    after(() => DataGenerator.destroyVariablesData());

    function fire(id) {
      document.body.dispatchEvent(new CustomEvent('environment-deleted', {
        bubbles: true,
        detail: {
          id
        }
      }));
    }

    it('Ignores when default is selected', async () => {
      const element = await basicFixture();
      await untilInitialized(element);
      fire(ids[0]);
      assert.isUndefined(element._env);
      assert.equal(element.environment, 'default');
    });

    it('Ignores when is not selected', async () => {
      const element = await environmentFixture();
      await untilInitialized(element);
      fire(ids[1]);
      assert.equal(element.environment, 'test');
    });

    it('Sets default environment', async () => {
      const element = await environmentFixture();
      await untilInitialized(element);
      fire(ids[0]);
      assert.equal(element.environment, 'default');
      assert.isUndefined(element._env);
    });
  });

  describe('environment-updated', function() {
    let createdId;

    before(async () => {
      const result = await VariablesTestHelper.addEnvs('test');
      createdId = result.id;
    });

    after(() => DataGenerator.destroyVariablesData());

    let updateObject;
    beforeEach(function() {
      updateObject = {
        _id: createdId,
        name: 'test-name'
      };
    });

    function fire(value) {
      document.body.dispatchEvent(new CustomEvent('environment-updated', {
        bubbles: true,
        detail: {
          value
        }
      }));
    }

    it('Does nothing when selected is default', async () => {
      const element = await basicFixture();
      await untilInitialized(element);
      fire(updateObject);
      assert.isUndefined(element._env);
      assert.equal(element.environment, 'default');
      assert.isUndefined(element._env);
    });

    it('Updates _env property', async () => {
      const element = await environmentFixture();
      await untilInitialized(element);
      fire(updateObject);
      assert.deepEqual(element._env, updateObject);
    });

    it('Updates environment name', async () => {
      const element = await environmentFixture();
      await untilInitialized(element);
      fire(updateObject);
      assert.deepEqual(element.environment, updateObject.name);
    });
  });
});
