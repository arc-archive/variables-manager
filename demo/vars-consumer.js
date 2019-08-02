import { LitElement } from 'lit-element';
import { VariablesConsumerMixin } from '@advanced-rest-client/variables-consumer-mixin/variables-consumer-mixin.js';
/**
 * An example of implementation of VariablesConsumerMixin
 *
 * @customElement
 * @polymer
 * @appliesMixin VariablesConsumerMixin
 */
class VarsConsumer extends VariablesConsumerMixin(LitElement) {
}
window.customElements.define('vars-consumer', VarsConsumer);
