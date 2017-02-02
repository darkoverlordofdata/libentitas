/**
 * World
 */
[indent=4]
uses Gee

namespace Entitas

    class World : Object

        /**
         * A list of component names
         * @type array of string
         * @name entitas.World#components */
        prop static readonly components: array of string

        /**
         * The world singleton instance
         * @type World
         * @name entitas.World#instance */
        prop static readonly instance : World

        /**
         * Utility prng
         * @type Rand
         * @name entitas.World#components */
        prop static readonly random : Rand

        /**
         * The total number of components in this pool
         * @type number
         * @name entitas.World#totalComponents */
        prop componentsCount : int
            get
                return _totalComponents

        /**
         * Count of active entities
         * @type number
         * @name entitas.World#count */
        prop count : int
            get
                return _entities.size

        /**
         * Count of entities waiting to be recycled
         * @type number
         * @name entitas.World#reusableEntitiesCount */
        prop reusableEntitiesCount : int
            get
                return (int)_reusableEntities.length

        /**
         * Count of entities that sill have references
         * @type number
         * @name entitas.World#retainedEntitiesCount */
        prop retainedEntitiesCount : int
            get
                return _retainedEntities.size

        /**
         * Subscribe to IEntity Created Event
         * @type entitas.utils.ISignal */
        prop readonly onEntityCreated : WorldChanged

        /**
         * Subscribe to IEntity Will Be Destroyed Event
         * @type entitas.utils.ISignal */
        prop readonly onEntityWillBeDestroyed : WorldChanged

        /**
         * Subscribe to IEntity Destroyed Event
         * @type entitas.utils.ISignal */
        prop readonly onEntityDestroyed : WorldChanged

        /**
         * Subscribe to Group Created Event
         * @type entitas.utils.ISignal */
        prop readonly onGroupCreated : GroupsChanged

        /**
         * IEntity name for debugging
         * @type string */
        prop readonly name : string


        _totalComponents    : int = 0
        _creationIndex      : int = 0
        _groups             : dict of string, Group
        _entities           : dict of string, IEntity
        _retainedEntities   : dict of string, IEntity
        _reusableEntities   : GLib.Queue of IEntity
        _groupsForIndex     : array of ArrayList of Group
        _componentsEnum     : array of string
        _entitiesCache      : array of IEntity
        _initializeSystems  : array of IInitializeSystem
        _executeSystems     : array of IExecuteSystem
        _entityFactory      : IEntityFactory

        /**
         * @constructor
         * @param Object components
         * @param number totalComponents
         * @param number startCreationIndex
         */
        construct(components : array of string, startCreationIndex : int=0)
            World._random = new Rand()
            World._instance = this
            World._components = components
            
            _onGroupCreated = new GroupsChanged()
            _onEntityCreated = new WorldChanged()
            _onEntityDestroyed = new WorldChanged()
            _onEntityWillBeDestroyed = new WorldChanged()

            _componentsEnum = components
            _totalComponents = components.length
            _creationIndex = startCreationIndex
            _groupsForIndex = new array of ArrayList of Group[components.length]

            _reusableEntities = new GLib.Queue of IEntity
            _retainedEntities = new dict of string, IEntity
            _entitiesCache = new array of IEntity[0]
            _entities = new dict of string, IEntity
            _groups = new dict of string, Group
            _initializeSystems = new array of IInitializeSystem[0]
            _executeSystems = new array of IExecuteSystem[0]


        def setEntityFactory(entityFactory: IEntityFactory): World
            _entityFactory = entityFactory
            return this

        def private newEntity(componentsEnum : array of string, totalComponents : int): IEntity
            if _entityFactory == null
                return (IEntity)(new Entity(_componentsEnum, _totalComponents))
            else
                return _entityFactory.createEntity(_componentsEnum, _totalComponents)

        /**
         * Create a new entity
         * @param string name
         * @returns entitas.IEntity
         */
        def createEntity(name : string) : IEntity
            // var entity = _reusableEntities.length > 0 ? _reusableEntities.pop_head() : (IEntity)(new Entity(_componentsEnum, _totalComponents))
            var entity = _reusableEntities.length > 0 ? _reusableEntities.pop_head() : newEntity(_componentsEnum, _totalComponents)
            //entity.initialize(name, UUID.randomUUID(), _creationIndex++)
            entity.initialize(name, uidgen(), _creationIndex++)
            _entities[entity.id] = entity
            _entitiesCache = new array of IEntity[0]
            entity.onComponentAdded.add(updateGroupsComponentAddedOrRemoved)
            entity.onComponentRemoved.add(updateGroupsComponentAddedOrRemoved)
            entity.onComponentReplaced.add(updateGroupsComponentReplaced)
            entity.onEntityReleased.add(onEntityReleased)

            onEntityCreated.dispatch(this, entity)
            return entity


        /**
         * Destroy an entity
         * @param entitas.IEntity entity
         */
        def destroyEntity(entity : IEntity) raises EcsException
            if !_entities.has_key(entity.id)
                raise new EcsException.WorldDoesNotContainEntity("Could not destroy entity!")

            _entities.unset(entity.id)
            _entitiesCache = new array of IEntity[0]
            _onEntityWillBeDestroyed.dispatch(this, entity)
            entity.destroy()

            _onEntityDestroyed.dispatch(this, entity)

            if entity.refCount == 1
                entity.onEntityReleased.remove(onEntityReleased)
                _reusableEntities.push_head(entity)
             else
                _retainedEntities[entity.id] = entity

            entity.release()

        /**
         * Destroy All Entities
         */
        def destroyAllEntities() raises EcsException
            var entities = getEntities()
            for var entity in entities
                destroyEntity(entity)

        /**
         * Check if pool has this entity
         *
         * @param entitas.IEntity entity
         * @returns boolean
         */
        def hasEntity(entity : IEntity) : bool
            return _entities.has_key(entity.id)

        /**
         * Gets all of the entities
         *
         * @returns Array<entitas.IEntity>
         */
        def getEntities(matcher : IMatcher?=null) : array of IEntity
            if matcher != null
                /** PoolExtension::getEntities */
                return getGroup(matcher).getEntities()
             else
                if _entitiesCache.length == 0
                    _entitiesCache = new array of IEntity[_entitiesCache.length]
                    for e in _entities.values
                        _entitiesCache+= e
                return _entitiesCache

        /**
         * add System
         * @param entitas.ISystem|Function
         * @returns entitas.ISystem
         */
        def add(system : ISystem) : World
            if system isa ISetWorld
                ((ISetWorld)system).setWorld(this)

            if system isa IInitializeSystem
                _initializeSystems += (IInitializeSystem)system

            if system isa IExecuteSystem
                _executeSystems += (IExecuteSystem)system

            return this

        /**
         * Initialize Systems
         */
        def initialize() : World
            for var sys in _initializeSystems
                sys.initialize()
            return this

        /**
         * Execute sustems
         */
        def execute()
            for var sys in _executeSystems
                sys.execute()

        /**
         * Gets all of the entities that match
         *
         * @param entias.IMatcher matcher
         * @returns entitas.Group
         */
        def getGroup(matcher : IMatcher) : Group
            group:Group

            if _groups.has_key(matcher.id)
                group = _groups[matcher.id]
            else
                group = new Group(matcher)

                var entities = getEntities()
                try
                    for var entity in entities
                        group.handleEntitySilently(entity)

                 except e : Error
                    assert(false)

                _groups[matcher.id] = group

                for var index in matcher.indices
                    if _groupsForIndex[index] == null
                        _groupsForIndex[index] = new ArrayList of Group
                    _groupsForIndex[index].add(group)
                _onGroupCreated.dispatch(this, group)
            return group


        /**
         * @param entitas.IEntity entity
         * @param number index
         * @param entitas.IComponent component
         */
        def updateGroupsComponentAddedOrRemoved(entity : IEntity, index : int, component : IComponent)
            if index+1 <= _groupsForIndex.length
                var groups = _groupsForIndex[index]
                if groups != null
                    try
                        for var group in groups
                            group.handleEntity(entity, index, component)

                    except e : Error
                        assert(false)

        /**
         * @param entitas.IEntity entity
         * @param number index
         * @param entitas.IComponent previousComponent
         * @param entitas.IComponent newComponent
         */
        def updateGroupsComponentReplaced(entity : IEntity, index : int, previousComponent : IComponent, newComponent : IComponent)
            if index+1 <= _groupsForIndex.length
                var groups = _groupsForIndex[index]
                if groups != null
                    for var group in groups
                        group.updateEntity(entity, index, previousComponent, newComponent)

        /**
         * @param entitas.IEntity entity
         */
        def onEntityReleased(entity : IEntity)
            if entity.isEnabled
                /*raise new Exception.EntityIsNotDestroyedException("Cannot release entity.")*/
                return

            entity.onEntityReleased.remove(onEntityReleased)
            _retainedEntities.unset(entity.id)
            _reusableEntities.push_head(entity)


        _hex: array of string = { // hex identity values 0-255
            "00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "0a", "0b", "0c", "0d", "0e", "0f",
            "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "1a", "1b", "1c", "1d", "1e", "1f",
            "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "2a", "2b", "2c", "2d", "2e", "2f",
            "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "3a", "3b", "3c", "3d", "3e", "3f",
            "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "4a", "4b", "4c", "4d", "4e", "4f",
            "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "5a", "5b", "5c", "5d", "5e", "5f",
            "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "6a", "6b", "6c", "6d", "6e", "6f",
            "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "7a", "7b", "7c", "7d", "7e", "7f",
            "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "8a", "8b", "8c", "8d", "8e", "8f",
            "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "9a", "9b", "9c", "9d", "9e", "9f",
            "a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "aa", "ab", "ac", "ad", "ae", "af",
            "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "ba", "bb", "bc", "bd", "be", "bf",
            "c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "ca", "cb", "cc", "cd", "ce", "cf",
            "d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "da", "db", "dc", "dd", "de", "df",
            "e0", "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "ea", "eb", "ec", "ed", "ee", "ef",
            "f0", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "fa", "fb", "fc", "fd", "fe", "ff"
        };
        /**
        * Fast UUID generator, RFC4122 version 4 compliant
        * format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        *
        * uid is used as id for entities for better distribution 
        * in hash tables than an incrementing id
        *
        *
        * @author Jeff Ward (jcward.com).
        * @license MIT license
        * @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
        **/

        def private uidgen(): string


            var d0 = random.int_range(0, 0xffff)
            var d1 = random.int_range(0, 0xffff)
            var d2 = random.int_range(0, 0xffff)
            var d3 = random.int_range(0, 0xffff)

            var hex00 = d0 & 0xff
            var hex01 = d0 >> 16 & 0xff
            var hex02 = d0 >> 24 & 0xff
            var hex03 = d1 & 0xff
            var hex04 = d1 >> 8 & 0xff
            var hex05 = d1 >> 16 & 0x0f | 0x40
            var hex06 = d1 >> 24 & 0xff
            var hex07 = d2 & 0x3f | 0x80
            var hex08 = d2 >> 8 & 0xff
            var hex09 = d2 >> 16 & 0xff
            var hex10 = d2 >> 24 & 0xff
            var hex11 = d3 & 0xff
            var hex12 = d3 >> 8 & 0xff
            var hex13 = d3 >> 16 & 0xff
            var hex14 = d3 >> 24 & 0xff
            //int hex15 = 0

            var sb = new StringBuilder()

            sb.append(_hex[hex00])
            sb.append(_hex[hex01])
            sb.append(_hex[hex02])
            sb.append("-")
            sb.append(_hex[hex03])
            sb.append(_hex[hex04])
            sb.append("-")
            sb.append(_hex[hex05])
            sb.append(_hex[hex06])
            sb.append("-")
            sb.append(_hex[hex07])
            sb.append(_hex[hex08])
            sb.append("-")
            sb.append(_hex[hex09])
            sb.append(_hex[hex10])
            sb.append(_hex[hex11])
            sb.append(_hex[hex12])
            sb.append(_hex[hex13])
            sb.append(_hex[hex14])

            return sb.str
