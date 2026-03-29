/**
 * Example: file-based routing with hot-reload
 *
 * Reads routing rules from logic-mapping.yaml and automatically re-applies
 * them whenever the file changes. Run a RabbitMQ instance locally before
 * starting:
 *
 *   docker run -d -p 5672:5672 rabbitmq:3
 */

import { RmqConnection } from '../lib/rmq-connection'

type PurchaseEvent = {
  orderId: number
  customer: string
}

async function main() {
  const rmq = new RmqConnection('guest:guest@localhost:5672');

  // Downstream consumers
  rmq.consume<PurchaseEvent>('billing',  msg => console.log('[billing]  received', msg));
  rmq.consume<PurchaseEvent>('supply',   msg => console.log('[supply]   received', msg));
  rmq.consume<PurchaseEvent>('shipping', msg => console.log('[shipping] received', msg));

  // Apply routing rules from YAML (hot-reloaded on file change)
  rmq.listenFileMapping('logic-mapping.yaml');

  // Simulate an incoming event
  setTimeout(() => {
    console.log('Sending incomingPurchase event...');
    rmq.sendToQueue('incomingPurchase', { orderId: 42, customer: 'Alice' });
  }, 500);
}

main();
