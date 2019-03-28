import { PolymerElement } from '../../../@polymer/polymer/polymer-element.js';
import '../../../variables-consumer-mixin/variables-consumer-mixin.js';
/**
 * An example of implementation of VariablesConsumerMixin
 *
 * @customElement
 * @polymer
 * @appliesMixin ArcComponents.VariablesConsumerMixin
 */
class VarsConsumer extends ArcComponents.VariablesConsumerMixin(PolymerElement) {
  static get is() {return 'vars-consumer';}
  static get properties() {
    return {

    };
  }
}
window.customElements.define(VarsConsumer.is, VarsConsumer);
