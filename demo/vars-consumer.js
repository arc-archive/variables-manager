import {PolymerElement} from '../../../@polymer/polymer/polymer-element.js';
import {VariablesConsumerMixin} from '../../../@advanced-rest-client/variables-consumer-mixin/variables-consumer-mixin.js';
/**
 * An example of implementation of VariablesConsumerMixin
 *
 * @customElement
 * @polymer
 * @appliesMixin VariablesConsumerMixin
 */
class VarsConsumer extends VariablesConsumerMixin(PolymerElement) {
  static get is() {return 'vars-consumer';}
  static get properties() {
    return {

    };
  }
}
window.customElements.define(VarsConsumer.is, VarsConsumer);
