import { EventEmitter } from "events";
import { inflate, deflate } from "pako";
import { InternalPlayerResponse } from "../types/gateway";

enum Op {
  Init,
  Heartbeat,
  Spotify,
  SpotifyChanged
}

interface SocketData {
  heartbeat_interval?: number;
}

interface SocketMessage {
  op: Op;
  t?: Event;
  d?: SocketData | { [key: string]: any };
}

export interface Gateway {
  ws: WebSocket;
  heartbeat: NodeJS.Timer;

  url: string;
  encoding: string; // 'etf' | 'json'
  compression: string; // 'zlib' | 'none'

  on(event: "spotify", listener: (data: InternalPlayerResponse) => void): this;
  on(event: "spotify_changed", listener: (data: InternalPlayerResponse) => void): this;
  on(event: "connected", listener: () => void): this;
  on(event: "init", listener: () => void): this;
}

export class Gateway extends EventEmitter {
  constructor(url = 'wss://gw.dstn.to', encoding = 'json', compression = 'zlib') {
    super();

    this.compression = compression;
    this.encoding = encoding;
    this.url = url;

    this.ws = new WebSocket(`${this.url}/socket?encoding=${this.encoding}&compression=${this.compression}`);
    if (this.compression != 'none') this.ws.binaryType = 'arraybuffer';

    // Socket open handler
    this.ws.addEventListener("open", () => this.emit("connected"));

    // Message listener
    this.ws.addEventListener("message", (e) => {
      const message = this.compression != 'none' ? JSON.parse(inflate(e.data, { to: 'string' })) : JSON.parse(e.data);

      try {
        this.message(message);
      } catch (error) { }
    });

    // Close event for websocket
    this.ws.addEventListener("close", () => clearInterval(this.heartbeat));
  }

  private send(op: Op, d?: any): void {
    if (this.ws.readyState != this.ws.OPEN) return;
    const data = this.compression != 'none' ? deflate(JSON.stringify({ op, d })) : JSON.stringify({ op, d });
    return this.ws.send(data);
  }

  private sendHeartbeat(): void {
    return this.send(Op.Heartbeat);
  }

  private message(data: SocketMessage): void {
    switch (data.op) {
      case Op.Init:
        // Got hello, start our heartbeat interval
        this.heartbeat = setInterval(
          () => this.sendHeartbeat(),
          data.d.heartbeat_interval
        );

        this.emit('init');

        break;
      case Op.Spotify:
        this.emit('spotify', data.d);

        break;
      case Op.SpotifyChanged:
        this.emit('spotify_changed', data.d);

        break;

      default:
        break;
    }
  }
}

export const gateway = typeof window != 'undefined' && new Gateway();