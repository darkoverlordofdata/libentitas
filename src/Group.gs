[indent=4]

namespace Entitas

    class Group : Object

        /**
         * Subscribe to IEntity Addded events
         * @type entitas.utils.ISignal */
        prop readonly onEntityAdded : GroupChanged
        /**
         * Subscribe to IEntity Removed events
         * @type entitas.utils.ISignal */
        prop readonly onEntityRemoved : GroupChanged
        /**
         * Subscribe to IEntity Updated events
         * @type entitas.utils.ISignal */
        prop readonly onEntityUpdated : GroupUpdated

        /**
         * Count the number of entities in this group
         * @type number
         * @name entitas.Group#count */
        prop count : int
            get
                return _entities.size

        /**
         * Get the Matcher for this group
         * @type entitas.IMatcher
         * @name entitas.Group#matcher */
        prop matcher : IMatcher
            get
                return _matcher

        _matcher            : IMatcher
        _entities           : dict of string, IEntity
        _entitiesCache      : array of IEntity
        _singleEntityCache  : IEntity
        _toStringCache      : string

        construct(matcher : IMatcher)
            _entities = new dict of string, IEntity
            _entitiesCache = new array of IEntity[0]
            _onEntityAdded = new GroupChanged()
            _onEntityRemoved = new GroupChanged()
            _onEntityUpdated = new GroupUpdated()
            _matcher = matcher

        /**
         * Handle adding and removing component from the entity without raising events
         * @param entity
         */
        def handleEntitySilently(entity : IEntity) raises EcsException
            if _matcher.matches(entity)
                addEntitySilently(entity)
            else
                removeEntitySilently(entity)

        /**
         * Handle adding and removing component from the entity and raisieevents
         * @param entity
         * @param index
         * @param component
         */
        def handleEntity(entity : IEntity, index : int, component : IComponent) raises EcsException
            if _matcher.matches(entity)
                addEntity(entity, index, component)
            else
                removeEntity(entity, index, component)

        /**
         * Update entity and raise events
         * @param entity
         * @param index
         * @param previousComponent
         * @param newComponent
         */
        def updateEntity(entity : IEntity, index : int, previousComponent : IComponent, newComponent : IComponent)
            if _entities.has_key(entity.id)
                _onEntityRemoved.dispatch(this, entity, index, previousComponent)
                _onEntityAdded.dispatch(this, entity, index, newComponent)
                _onEntityUpdated.dispatch(this, entity, index, previousComponent, newComponent)

        /**
         * Add entity without raising events
         * @param entity
         */
        def addEntitySilently(entity : IEntity)
            if !_entities.has_key(entity.id)
                _entities[entity.id] = entity
                _entitiesCache = null
                _singleEntityCache = null
                entity.addRef()

        /**
         * Add entity and raise events
         * @param entity
         * @param index
         * @param component
         */
        def addEntity(entity : IEntity, index : int, component : IComponent)
            if !_entities.has_key(entity.id)
                _entities[entity.id] = entity
                _entitiesCache = null
                _singleEntityCache = null
                entity.addRef()
                _onEntityAdded.dispatch(this, entity, index, component)

        /**
         * Remove entity without raising events
         * @param entity
         */
        def removeEntitySilently(entity : IEntity) raises EcsException
            if _entities.has_key(entity.id)
                _entities.unset(entity.id)
                _entitiesCache = null
                _singleEntityCache = null
                entity.release()

        /**
         * Remove entity and raise events
         * @param entity
         * @param index
         * @param component
         */
        def removeEntity(entity : IEntity, index : int, component : IComponent) raises EcsException
            if _entities.has_key(entity.id)
                _entities.unset(entity.id)
                _entitiesCache = null
                _singleEntityCache = null
                _onEntityRemoved.dispatch(this, entity, index, component)
                entity.release()

        /**
         * Check if group has this entity
         *
         * @param entity
         * @returns boolean
         */
        def containsEntity(entity : IEntity) : bool
            return _entities.has_key(entity.id)

        /**
         * Get a list of the entities in this group
         *
         * @returns Array<entitas.IEntity>
         */
        def getEntities() : array of IEntity
            if _entitiesCache.length == 0
                _entitiesCache = new array of IEntity[_entities.values.size]
                var i = 0
                for var e in _entities.values
                    _entitiesCache[i++] = e

            return _entitiesCache

        /**
         * Gets an entity singleton.
         * If a group has more than 1 entity, this is an error condition.
         *
         * @returns entitas.IEntity
         */
        def getSingleEntity() : unowned IEntity? raises EcsException
            if _singleEntityCache == null
                var values = _entities.values
                var c = values.size
                if c == 1
                    for var e in _entities.values
                        _singleEntityCache = e
                else if c == 0
                    return null
                else
                    raise new EcsException.SingleEntity(_matcher.toString())
            return _singleEntityCache

        /**
         * Create a string representation for this group:
         *
         *    ex: 'Group(Position)'
         *
         * @returns string
         */
        def toString() : string
            //componentsEnum
            if _toStringCache == null
                var sb = new array of string[0]
                for var index in _matcher.indices
                    sb += World.components[index].replace("Component", "")
                _toStringCache = "Group(" + string.joinv(",", sb) + ")"
            return _toStringCache
