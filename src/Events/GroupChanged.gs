[indent=4]

namespace Entitas

    delegate OnGroupChanged(g : Group, e : IEntity, i : int, c : IComponent)

    class GroupChanged : Object

        class Listener : Object
            prop event : unowned OnGroupChanged
            construct(event : OnGroupChanged)
                _event = event

        _listeners : list of Listener = new list of Listener

        def add(event : OnGroupChanged)
            _listeners.add(new Listener(event))

        def remove(event : OnGroupChanged)
            for var listener in _listeners
                if listener.event == event
                    _listeners.remove(listener)
                    return

        def clear()
            _listeners = new list of Listener

        def dispatch(g : Group, e : IEntity, i : int, c : IComponent)
            for var listener in _listeners
                listener.event(g, e, i, c)
