import { io, Socket } from 'socket.io-client';

export interface SocketEvent {
  event_type: string;
  user_id?: string;
  room?: string;
  data: any;
  timestamp: string;
  source: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface RealTimeData {
  pending_screenings?: number;
  today_appointments?: number;
  recent_alerts?: any[];
  recent_screenings?: number;
  upcoming_appointments?: any[];
  notifications?: Notification[];
  class_screening_stats?: any[];
  pending_consents?: number;
  recent_results?: any[];
  total_patients?: number;
  total_screenings?: number;
  system_health?: string;
  recent_activities?: any[];
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8014';
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection_established', { timestamp: new Date().toISOString() });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // System events
    this.socket.on('system_status', (data) => {
      console.log('System status:', data);
      this.triggerEvent('system_status', data);
    });

    this.socket.on('system_message', (data) => {
      console.log('System message:', data);
      this.triggerEvent('system_message', data);
    });

    // Health check
    this.socket.on('health_check', (data) => {
      console.log('Health check:', data);
      this.triggerEvent('health_check', data);
    });

    this.socket.on('pong', () => {
      console.log('Pong received');
    });

    // Room events
    this.socket.on('joined_room', (data) => {
      console.log('Joined room:', data);
      this.triggerEvent('joined_room', data);
    });

    this.socket.on('room_joined', (data) => {
      console.log('Room joined:', data);
      this.triggerEvent('room_joined', data);
    });

    this.socket.on('room_left', (data) => {
      console.log('Room left:', data);
      this.triggerEvent('room_left', data);
    });

    // Subscription events
    this.socket.on('subscription_confirmed', (data) => {
      console.log('Subscription confirmed:', data);
      this.triggerEvent('subscription_confirmed', data);
    });

    // Dashboard data events
    this.socket.on('doctor_dashboard_data', (data) => {
      console.log('Doctor dashboard data:', data);
      this.triggerEvent('doctor_dashboard_data', data);
    });

    this.socket.on('parent_dashboard_data', (data) => {
      console.log('Parent dashboard data:', data);
      this.triggerEvent('parent_dashboard_data', data);
    });

    this.socket.on('teacher_dashboard_data', (data) => {
      console.log('Teacher dashboard data:', data);
      this.triggerEvent('teacher_dashboard_data', data);
    });

    this.socket.on('executive_dashboard_data', (data) => {
      console.log('Executive dashboard data:', data);
      this.triggerEvent('executive_dashboard_data', data);
    });

    // Real-time updates
    this.socket.on('screening_updated', (data) => {
      console.log('Screening updated:', data);
      this.triggerEvent('screening_updated', data);
    });

    this.socket.on('notification', (data) => {
      console.log('New notification:', data);
      this.triggerEvent('notification', data);
    });

    // Messaging events
    this.socket.on('new_message', (data) => {
      console.log('New message:', data);
      this.triggerEvent('new_message', data);
    });

    this.socket.on('message_sent', (data) => {
      console.log('Message sent:', data);
      this.triggerEvent('message_sent', data);
    });

    this.socket.on('message_error', (data) => {
      console.log('Message error:', data);
      this.triggerEvent('message_error', data);
    });
  }

  // Connection management
  public connect(auth?: any): void {
    if (this.socket && !this.isConnected) {
      this.socket.auth = auth;
      this.socket.connect();
    }
  }

  public disconnect(): void {
    if (this.socket && this.isConnected) {
      this.socket.disconnect();
    }
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }

  // Event emission
  public emit(event: string, data?: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Room management
  public async joinRoom(room: string): Promise<void> {
    this.emit('join_room', { room });
  }

  public async leaveRoom(room: string): Promise<void> {
    this.emit('leave_room', { room });
  }

  // Subscription management
  public async subscribeToUpdates(type: string, filters?: any): Promise<void> {
    this.emit('subscribe_to_updates', { type, filters });
  }

  // Messaging
  public async sendMessage(targetUser: string, message: string): Promise<void> {
    this.emit('send_message', { target_user: targetUser, message });
  }

  // Health check
  public async ping(): Promise<void> {
    this.emit('ping');
  }

  // Event listening
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback?: Function): void {
    if (!this.eventListeners.has(event)) return;

    if (callback) {
      const listeners = this.eventListeners.get(event)!;
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.eventListeners.delete(event);
    }
  }

  private triggerEvent(event: string, data: any): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  public getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
