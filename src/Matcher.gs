[indent=4]

namespace Entitas

    /**
     * Event Types
     * @readonly
     * @enum number
     */
    enum GroupEventType
        OnEntityAdded
        OnEntityRemoved
        OnEntityAddedOrRemoved


    class Matcher : Object implements IMatcher, IAllOfMatcher, IAnyOfMatcher, INoneOfMatcher

        /**
         * A unique sequential index number assigned to each ,atch
         * @type number */
        uniqueId : static int

        /**
         * Get the matcher id
         * @type number
         * @name entitas.Matcher#id */
        prop readonly id : string

        /**
         * A list of the component ordinals that this matches
         * @type Array<number>
         * @name entitas.Matcher#indices */
        prop readonly indices : array of int
            get
                if _indices == null
                    _indices = mergeIndices()
                return _indices

        /**
         * A unique sequential index number assigned to each entity at creation
         * @type number
         * @name entitas.Matcher#allOfIndices */
        prop readonly allOfIndices : array of int

        /**
         * A unique sequential index number assigned to each entity at creation
         * @type number
         * @name entitas.Matcher#anyOfIndices */
        prop readonly anyOfIndices : array of int

        /**
         * A unique sequential index number assigned to each entity at creation
         * @type number
         * @name entitas.Matcher#noneOfIndices */
        prop readonly noneOfIndices : array of int

        _indices        : array of int
        _toStringCache  : string

        construct()
            _id = (Matcher.uniqueId++).to_string()

        /**
         * Matches anyOf the components/indices specified
         * @params Array<entitas.IMatcher>|Array<number> args
         * @returns entitas.Matcher
         */
        def anyOf(args : array of int) : IAnyOfMatcher
            _anyOfIndices = Matcher.distinctIndices(args)
            _indices = null
            return this

        /**
         * Matches noneOf the components/indices specified
         * @params Array<entitas.IMatcher>|Array<number> args
         * @returns entitas.Matcher
         */
        def noneOf(args : array of int) : INoneOfMatcher
            _noneOfIndices = Matcher.distinctIndices(args)
            _indices = null
            return this

        /**
         * Check if the entity matches this matcher
         * @param entitas.IEntity entity
         * @returns boolean
         */
        def matches(entity : IEntity) : bool
            var matchesAllOf = _allOfIndices == null ? true : entity.hasComponents(_allOfIndices)
            var matchesAnyOf = _anyOfIndices == null ? true : entity.hasAnyComponent(_anyOfIndices)
            var matchesNoneOf = _noneOfIndices == null ? true : !entity.hasAnyComponent(_noneOfIndices)
            return matchesAllOf && matchesAnyOf && matchesNoneOf

        /**
         * Merge list of component indices
         * @returns Array<number>
         */
        def mergeIndices() : array of int

            var indicesList = new list of int
            if _allOfIndices != null
                for var i in _allOfIndices
                    indicesList.add(i)

            if _anyOfIndices != null
                for var i in _anyOfIndices
                    indicesList.add(i)

            if _noneOfIndices != null
                for var i in _noneOfIndices
                    indicesList.add(i)

            return Matcher.distinctIndices(listToArray(indicesList))

        /**
         * toString representation of this matcher
         * @returns string
         */
        def toString() : string
            if _toStringCache == null
                var sb = new array of string[0]
                if _allOfIndices != null
                    sb += "AllOf("
                    sb += componentsToString(_allOfIndices)
                    sb += ")"

                if _anyOfIndices != null
                    if _allOfIndices != null
                        sb += "."

                    sb += "AnyOf("
                    sb += componentsToString(_anyOfIndices)
                    sb += ")"

                if _noneOfIndices != null
                    sb += ".NoneOf("
                    sb += componentsToString(_noneOfIndices)
                    sb += ")"

                _toStringCache = string.joinv("", sb)

            return _toStringCache

        def static componentsToString(indexArray : array of int) : string
            var sb = new array of string[0]
            for var index in indexArray
                sb += World.components[index-1].replace("Component", "")
            return string.joinv(",", sb)

        def static listToArray(l : list of int) : array of int
            var a = new array of int[l.size]
            for var i=0 to (l.size-1)
                a[i] = l[i]
            return a

        /**
         * Get the set if distinct (non-duplicate) indices from a list
         * @param Array<number> indices
         * @returns Array<number>
         */
        def static distinctIndices(indices : array of int) : array of int
            var indicesSet = new dict of int, bool
            var result = new list of int

            for var index in indices
                if !indicesSet.has_key(index)
                    result.add(index)
                indicesSet[index] = true

            return listToArray(result)

        /**
         * Merge all the indices of a set of Matchers
         * @param Array<IMatcher> matchers
         * @returns Array<number>
         */
        def static merge(matchers : array of IMatcher) : array of int raises EcsException
            var indices = new list of int

            for var matcher in matchers
                if matcher.indices.length != 1
                    //raise new Exception.ECS("MatcherException - %s", matcher.toString())
                    raise new EcsException.Matcher(matcher.toString())

                indices.add(matcher.indices[0])
            return listToArray(indices)

        /**
         * Matches allOf the components/indices specified
         * @params Array<entitas.IMatcher>|Array<number> args
         * @returns entitas.Matcher
         */
        def static AllOf(args : array of int) : IMatcher
            var matcher = new Matcher()
            matcher._allOfIndices = Matcher.distinctIndices(args)
            return matcher

        /**
         * Matches anyOf the components/indices specified
         * @params Array<entitas.IMatcher>|Array<number> args
         * @returns entitas.Matcher
         */
        def static AnyOf(args : array of int) : IMatcher
            var matcher = new Matcher()
            matcher._anyOfIndices = Matcher.distinctIndices(args)
            return matcher
