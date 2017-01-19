/**
 * Base class for Entitities
 */
[indent=4]
namespace Entitas


    interface IEntityFactory : Object
        def abstract createEntity(componentsEnum : array of string, totalComponents : int): IEntity


    interface IEntity : Object

        prop abstract readonly creationIndex : int
        prop abstract readonly name : string
        prop abstract readonly id : string
        prop abstract readonly isEnabled : bool
        prop abstract readonly refCount : int
        prop abstract readonly onEntityReleased : EntityReleased
        prop abstract readonly onComponentAdded : EntityChanged
        prop abstract readonly onComponentRemoved : EntityChanged
        prop abstract readonly onComponentReplaced : ComponentReplaced

        def abstract initialize(name : string, id : string, creationIndex : int)
        def abstract addComponent(index : int, component : IComponent) : IEntity raises EcsException
        def abstract removeComponent(index : int) : IEntity raises EcsException
        def abstract replaceComponent(index : int, component : IComponent) : IEntity raises EcsException
        def abstract getComponent(index : int) : unowned IComponent raises EcsException
        def abstract getComponents() : array of IComponent
        def abstract getComponentIndices() : array of int
        def abstract hasComponent(index : int) : bool
        def abstract hasComponents(indices : array of int) : bool
        def abstract hasAnyComponent(indices : array of int) : bool
        def abstract removeAllComponents()
        def abstract destroy()
        def abstract toString() : string
        def abstract addRef() : IEntity
        def abstract release() raises EcsException


