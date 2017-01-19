/**
 * Base class for Entitities
 */
[indent=4]
namespace Entitas

    const POOL_SIZE : int = 128

    class Entity : Object implements IEntity

        /**
         * @static
         * @type number */
        size : static int = 0

        /**
         * A unique sequential index number assigned to each entity at creation
         * @type number
         * @name entitas.IEntity#creationIndex */
        prop readonly creationIndex : int

        /**
         * IEntity name
         * @type string */
        prop readonly name : string

        /**
         *    IEntity id
         * @type string */
        prop readonly id : string

        prop readonly isEnabled : bool

        prop readonly refCount : int


        /**
         * Subscribe to IEntity Released Event
         * @type entitas.ISignal */
        prop readonly onEntityReleased : EntityReleased

        /**
         * Subscribe to Component Added Event
         * @type entitas.ISignal */
        prop readonly onComponentAdded : EntityChanged

        /**
         * Subscribe to Component Removed Event
         * @type entitas.ISignal */
        prop readonly onComponentRemoved : EntityChanged

        /**
         * Subscribe to Component Replaced Event
         * @type entitas.ISignal */
        prop readonly onComponentReplaced : ComponentReplaced

        first           : static bool = true
        maxEntities     : static int = 128
        incEntities     : static int = 64
        db_index        : static int = 0
        _components     : static array of IComponent

        db_id           : int = 0
        ic              : int = 0
        _totalComponents: int
        _componentCount : int
        _toStringCache  : string
        _componentsEnum : unowned array of string
        _world          : World
        _componentsCache: array of IComponent
        _indiceCache    : array of int

        /**
         * The basic game object. Everything is an entity with components that
         * are added / removed as needed.
         *
         * @param Object componentsEnum
         * @param number totalComponents
         * @constructor
         */
        construct(componentsEnum : array of string, totalComponents : int = 32)

            _totalComponents = totalComponents
            _componentCount = componentsEnum.length

            if first
                _components = new array of IComponent[_componentCount * maxEntities]
                first = false

            if db_index >= maxEntities
                maxEntities += incEntities
                _components.resize(_componentCount * maxEntities)

            db_id = db_index++
            ic = db_id * _componentCount

            _onEntityReleased = new EntityReleased()
            _onComponentAdded = new EntityChanged()
            _onComponentRemoved = new EntityChanged()
            _onComponentReplaced = new ComponentReplaced()
            _indiceCache = new array of int[totalComponents]
            _componentsEnum = componentsEnum
            _world = World.instance


        /**
         * Initialize the entity after allocation from the pool
         *
         * @param string  name
         * @param string  id
         * @param int creationIndex
         */
        def initialize(name : string, id : string, creationIndex : int)
            _name = name
            _creationIndex = creationIndex
            _isEnabled = true
            _id = id
            addRef()

         /**
          * AddComponent
          *
          * @param number index
          * @param entitas.IComponent component
          * @returns entitas.IEntity
          */
        def addComponent(index : int, component : IComponent) : IEntity raises EcsException
            if !_isEnabled
                raise new EcsException.EntityIsNotEnabled("Cannot add component!")

            if hasComponent(index)
                raise new EcsException.EntityAlreadyHasComponent("Cannot add %s at index %d", _componentsEnum[index], index)

            _components[ic+index] = component
            _componentsCache = null
            _indiceCache = null
            _toStringCache = null
            _onComponentAdded.dispatch((IEntity)this, index, component)
            return (IEntity)this

        /**
         * RemoveComponent
         *
         * @param number index
         * @returns entitas.IEntity
         */
        def removeComponent(index : int) : IEntity raises EcsException
            if !_isEnabled
                raise new EcsException.EntityIsNotEnabled("Cannot remove component!")

            if !hasComponent(index)
                raise new EcsException.EntityDoesNotHaveComponent("Cannot remove %s at index %d", _componentsEnum[index], index)

            _replaceComponent(index, null)
            return (IEntity)this

        /**
         * ReplaceComponent
         *
         * @param number index
         * @param entitas.IComponent component
         * @returns entitas.IEntity
         */
        def replaceComponent(index : int, component : IComponent) : IEntity raises EcsException
            if !_isEnabled
                raise new EcsException.EntityIsNotEnabled("Cannot replace component!")

            if hasComponent(index)
                _replaceComponent(index, component)
             else if component != null
                addComponent(index, component)

            return (IEntity)this


        def _replaceComponent(index : int, replacement : IComponent?)
            var previousComponent = _components[ic+index]
            if previousComponent == replacement
                _onComponentReplaced.dispatch((IEntity)this, index, previousComponent, replacement)
             else
                _components[ic+index] = replacement
                _componentsCache = null
                if replacement == null
                    _components[ic+index] = null
                    _indiceCache = null
                    _toStringCache = null
                    _onComponentRemoved.dispatch((IEntity)this, index, previousComponent)

                 else
                    _onComponentReplaced.dispatch((IEntity)this, index, previousComponent, replacement)

        /**
         * GetComponent
         *
         * @param number index
         * @param entitas.IComponent component
         */
        def getComponent(index : int) : unowned IComponent raises EcsException
            if !hasComponent(index)
                raise new EcsException.EntityDoesNotHaveComponent("Cannot get %s at index %d", _componentsEnum[index], index)

            return _components[ic+index]

        /**
         * GetComponents
         *
         * @returns Array<entitas.IComponent>
         */
        def getComponents() : array of IComponent
            if _componentsCache == null
                var components = new array of IComponent[0]
                //for var component in _components
                for var i = ic to (ic+_componentCount-1)
                    if _components[i] != null
                        components+= _components[i]
                _componentsCache = components
            return _componentsCache

        /**
         * GetComponentIndices
         *
         * @returns Array<number>
         */
        def getComponentIndices() : array of int
            if _indiceCache == null
                var indices = new array of int[0]
                var index = 0
                for var i = ic to (ic+_componentCount-1)
                    if _components[i] != null
                        indices+= index
                    index++
                _indiceCache = indices
            return _indiceCache

         /**
          * HasComponent
          *
          * @param number index
          * @returns boolean
          */
        def hasComponent(index : int) : bool
            return _components[ic+index] != null

        /**
         * HasComponents
         *
         * @param Array<number> indices
         * @returns boolean
         */
        def hasComponents(indices : array of int) : bool
            for var index in indices
                if _components[ic+index] == null
                    return false
            return true

        /**
         * HasAnyComponent
         *
         * @param Array<number> indices
         * @returns boolean
         */
        def hasAnyComponent(indices : array of int) : bool
            for var index in indices
                if _components[ic+index] != null
                    return true
            return false

        /**
         * RemoveAllComponents
         *
         */
        def removeAllComponents()
            _toStringCache = ""
            var index = 0
            for var i = ic to (ic+_componentCount-1)
                if _components[i] != null
                    _replaceComponent(index, null)
                index++

        /**
         * Destroy
         *
         */
        def destroy()
            removeAllComponents()
            _onComponentAdded.clear()
            _onComponentReplaced.clear()
            _onComponentRemoved.clear()
            _isEnabled = false


        /**
         * ToString
         *
         * @returns string
         */
        def toString() : string
            if _toStringCache == null
                var sb = new StringBuilder()
                var seperator = ", "

                var components = getComponentIndices()
                var lastSeperator = components.length - 1
                for var i = 0 to (lastSeperator)
                    sb.append(_componentsEnum[components[i]].replace("Component", ""))
                    if i < lastSeperator
                        sb.append(seperator)
                _toStringCache = sb.str
            return _toStringCache

        /**
         * AddRef
         *
         * @returns entitas.IEntity
         */
        def addRef() : IEntity
            _refCount += 1
            return (IEntity)this


        /**
         * Release
         *
         */
        def release() raises EcsException
            _refCount -= 1
            if _refCount == 0
                _onEntityReleased.dispatch((IEntity)this)
            else if _refCount < 0
                raise new EcsException.EntityIsAlreadyReleased("%s:%s", id, name)


