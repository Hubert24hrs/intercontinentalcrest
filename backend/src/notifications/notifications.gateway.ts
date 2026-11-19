import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { getAccessSecret } from '../auth/jwt.config';

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

/**
 * Real-time notifications for long-running deployments (local / Docker).
 * Serverless hosts can't keep sockets open, so the web app also polls.
 * Clients must present a valid access token; the room is derived from the
 * token, never from a client-supplied user id.
 */
@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) =>
      cb(null, !origin || /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)),
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly jwt = new JwtService();

  handleConnection(client: Socket) {
    const token =
      (client.handshake.auth as any)?.token ||
      readCookie(client.handshake.headers?.cookie, 'accessToken');
    try {
      const payload: any = this.jwt.verify(String(token || ''), { secret: getAccessSecret() });
      if (!payload?.sub || payload.typ !== 'access') throw new Error('bad token');
      client.join(`user_${payload.sub}`);
    } catch {
      client.disconnect(true);
    }
  }

  sendNotification(userId: string, notification: unknown) {
    this.server?.to(`user_${userId}`).emit('notification', notification);
  }
}
