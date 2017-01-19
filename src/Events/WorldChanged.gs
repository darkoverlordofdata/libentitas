[indent=4]

namespace Entitas

    delegate OnWorldChanged(w : World, e : IEntity)

    class WorldChanged : Object

        class Listener : Object
            prop event : unowned OnWorldChanged
            construct(event : OnWorldChanged)
                _event = event

        _listeners : list of Listener = new list of Listener

        def add(event : OnWorldChanged)
            _listeners.add(new Listener(event))

        def remove(event : OnWorldChanged)
            for var listener in _listeners
                if listener.event == event
                    _listeners.remove(listener)
                    return

        def clear()
            _listeners = new list of Listener

        def dispatch(w : World, e : IEntity)
            for var listener in _listeners
                listener.event(w, e)
