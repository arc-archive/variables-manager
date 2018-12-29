/**
 * Tests helper with common functions.
 */
const VariablesTestHelper = {
  /**
   * Fires a custom event
   *
   * @param {String} type Event name
   * @param {?Object} detail The detail object to pass to the event
   * @param {?HTMLElment} node Node on which dispatch the event. Default to
   * document.
   * @return {CustomEvent} Fired event.
   */
  fire: function(type, detail, node) {
    const event = new CustomEvent(type, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: detail
    });
    (node || document).dispatchEvent(event);
    return event;
  },
  /**
   * Adds one or more test variables.
   *
   * @param {Array|Object} items List of items to add or an item to add
   * @return {Promise}
   */
  addVars: function(items) {
    /* global PouchDB */
    const db = new PouchDB('variables');
    return VariablesTestHelper.addItems(db, items);
  },

  /**
   * Adds one or more test environments.
   *
   * @param {Array|String} names List of environment names or single name to add
   * @return {Promise}
   */
  addEnvs: function(names) {
    const db = new PouchDB('variables-environments');
    if (names instanceof Array) {
      names = names.map(function(item) {
        return {
          name: item
        };
      });
    } else {
      names = {
        name: names
      };
    }
    return VariablesTestHelper.addItems(db, names);
  },

  addItems: function(db, items) {
    if (items instanceof Array) {
      return db.bulkDocs(items);
    }
    return db.post(items);
  }
};
