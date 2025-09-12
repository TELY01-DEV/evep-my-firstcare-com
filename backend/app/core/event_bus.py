from typing import Dict, List, Callable, Any
from collections import defaultdict
import asyncio
import logging

logger = logging.getLogger(__name__)

class EventBus:
    _instance = None
    _events: Dict[str, List[Callable]] = defaultdict(list)
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def subscribe(self, event: str, callback: Callable) -> None:
        """Subscribe to an event"""
        self._events[event].append(callback)
        logger.info(f"Subscribed to event: {event}")
    
    def unsubscribe(self, event: str, callback: Callable) -> None:
        """Unsubscribe from an event"""
        if event in self._events:
            self._events[event].remove(callback)
            logger.info(f"Unsubscribed from event: {event}")
    
    async def emit(self, event: str, data: Any = None) -> None:
        """Emit an event"""
        if event in self._events:
            logger.info(f"Emitting event: {event}")
            for callback in self._events[event]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(data)
                    else:
                        callback(data)
                except Exception as e:
                    logger.error(f"Error in event callback for {event}: {e}")
    
    def get_subscribers(self, event: str) -> List[Callable]:
        """Get subscribers for an event"""
        return self._events.get(event, [])
    
    def get_all_events(self) -> List[str]:
        """Get all registered events"""
        return list(self._events.keys())
    
    def get_subscriber_count(self, event: str) -> int:
        """Get number of subscribers for an event"""
        return len(self._events.get(event, []))
    
    def clear_event(self, event: str) -> None:
        """Clear all subscribers for an event"""
        if event in self._events:
            del self._events[event]
            logger.info(f"Cleared event: {event}")
    
    def clear_all_events(self) -> None:
        """Clear all events and subscribers"""
        self._events.clear()
        logger.info("Cleared all events")

# Global event bus instance
event_bus = EventBus()



