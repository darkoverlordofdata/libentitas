[indent=4]

namespace Entitas

    delegate OnGroupsChanged(w : World, g : Group)

    class GroupsChanged : Object
        class Listener : Object
            prop event : unowned OnGroupsChanged
            construct(event : OnGroupsChanged)
                _event = event

        _listeners : list of Listener = new list of Listener

        def add(event : OnGroupsChanged)
            _listeners.add(new Listener(event))

        def remove(event : OnGroupsChanged)
            for var listener in _listeners
                if listener.event == event
                    _listeners.remove(listener)
                    return

        def clear()
            _listeners = new list of Listener

        def dispatch(w : World, g : Group)
            for var listener in _listeners
                listener.event(w, g)
