import { Connection, Consumer, Publisher } from 'rabbitmq-client'
import fs from 'fs'
import YAML from 'yaml'



export class RmqConnection {
  protected connection!: Connection;
  protected connected!: Boolean;
  protected pub!: Publisher;
  protected subs = new Array<Consumer>();
  protected mappingSubs = new Array<Consumer>();

  public constructor(private host: string){
  }

  public async connect() {
    if (this.connected && this.connection) return;

    try {  
      this.connection = new Connection(`amqp://${this.host}`);
      this.connected = true;

      this.pub = this.connection.createPublisher();
    } catch (error) {
      console.error(error);
    }
  }

  public setMapping(mapping: Record<string, string[]>){
    this.mappingSubs.forEach(s => s.close());
    this.mappingSubs = [];

    for (const eventName in mapping){
      if (!this.connected) {
        this.connect();
      }
      const sub = this.connection.createConsumer({ queue: eventName }, async (msg) => {
        try {
          const data = JSON.parse(msg.body.toString());
          mapping[eventName].forEach(forwardQueue => {
            this.sendToQueue(forwardQueue.trim(), data);
          });
        } catch (e) {
          // ignore malformed messages
        }
      });
      this.mappingSubs.push(sub);
    }
  }

  public listenFileMapping(fileName: string){
    const applyFileContent = () => {
      const file = fs.readFileSync(fileName, 'utf8')
      const content = YAML.parse(file) as Record<string, string[]>;
    
      this.setMapping(content);
    }

    applyFileContent();

    fs.watch(fileName, (eventType, filename) => {
      if (eventType === 'change'){
        applyFileContent();
      }
    });
  }

  async sendToQueue<T>(queue: string, message: T) {
    this.pub.send(queue, Buffer.from(JSON.stringify(message)));    
  }

  async consume<T>(queue: string, callback: (msg: T) => void) {
    if (!this.connected) {
      await this.connect();
    }    
    const sub = this.connection.createConsumer({ queue }, async (msg) => {         
      try{
        const data = JSON.parse(msg.body.toString()) as T;
        callback(data);
      }catch(e){
      }   
    });  
    this.subs.push(sub);      
  }

  close(){
    this.pub.close();
    this.subs.forEach(s => s.close());
    this.mappingSubs.forEach(s => s.close());
  }
}