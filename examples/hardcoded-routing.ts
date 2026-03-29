/**
 * Example: programmatic (hardcoded) routing
 *
 * Explicitly defines which queues receive each message without a config file.
 * Run a RabbitMQ instance locally before starting:
 *
 *   docker run -d -p 5672:5672 rabbitmq:3
 */

import { RmqConnection } from '../lib/rmq-connection'

type OrderEvent = {
  orderId: number
  amount: number
}

async function main() {
  const rmq = new RmqConnection('guest:guest@localhost:5672');

  // Downstream consumers
  rmq.consume<OrderEvent>('billing',  msg => console.log('[billing]  received', msg));
  rmq.consume<OrderEvent>('supply',   msg => console.log('[supply]   received', msg));
  rmq.consume<OrderEvent>('shipping', msg => console.log('[shipping] received', msg));

  // Fan-out: forward every message from Q1 to three queues
  rmq.setMapping({
    Q1: ['billing', 'supply', 'shipping'],
  });

  // Simulate an incoming event
  setTimeout(() => {
    console.log('Sending event to Q1...');
    rmq.sendToQueue('Q1', { orderId: 1, amount: 99.9 });
  }, 500);
}

main();
