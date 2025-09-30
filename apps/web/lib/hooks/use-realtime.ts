import { useEffect, useState } from "react";
import Pusher from "pusher-js";

interface UseRealtimeOptions {
  channel: string;
  events: {
    [eventName: string]: (data: any) => void;
  };
}

export function useRealtime({ channel, events }: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [pusher, setPusher] = useState<Pusher | null>(null);

  useEffect(() => {
    // Only initialize if Pusher is configured
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
      console.warn("Pusher not configured");
      return;
    }

    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "sa1",
    });

    setPusher(pusherClient);

    pusherClient.connection.bind("connected", () => {
      setIsConnected(true);
      console.log("Pusher connected");
    });

    pusherClient.connection.bind("disconnected", () => {
      setIsConnected(false);
      console.log("Pusher disconnected");
    });

    const channelInstance = pusherClient.subscribe(channel);

    // Bind all events
    Object.entries(events).forEach(([eventName, handler]) => {
      channelInstance.bind(eventName, handler);
    });

    return () => {
      Object.keys(events).forEach((eventName) => {
        channelInstance.unbind(eventName);
      });
      pusherClient.unsubscribe(channel);
      pusherClient.disconnect();
    };
  }, [channel]);

  return {
    isConnected,
    pusher,
  };
}

// Specialized hook for board updates
export function useBoardRealtime(boardId: string, onUpdate: () => void) {
  return useRealtime({
    channel: `board-${boardId}`,
    events: {
      "card:created": onUpdate,
      "card:updated": onUpdate,
      "card:moved": onUpdate,
      "card:deleted": onUpdate,
      "column:created": onUpdate,
      "column:updated": onUpdate,
    },
  });
}

// Specialized hook for inbox updates
export function useInboxRealtime(userId: string, onNewNotification: (data: any) => void) {
  return useRealtime({
    channel: `user-${userId}`,
    events: {
      "notification:new": onNewNotification,
      "invite:received": onNewNotification,
    },
  });
}