[indent=4]

namespace Entitas

    delegate OnEntityReleased(e : IEntity)
    
    class EntityReleased : Object

        class Listener : Object
            prop event : unowned OnEntityReleased
            construct(event : OnEntityReleased)
                _event = event

        _listeners : list of Listener = new list of Listener

        def add(event : OnEntityReleased)
            _listeners.add(new Listener(event))

        def remove(event : OnEntityReleased)
            for var listener in _listeners
                if listener.event == event
                    _listeners.remove(listener)
                    return

        def clear()
            _listeners = new list of Listener

        def dispatch(e : IEntity)
            for var listener in _listeners
                listener.event(e)
