namespace Entitas {
    public interface ISystem : Object  {

    }

    public interface ISetWorld : Object  {
      public abstract void setWorld(World world);
    }

    public interface IExecuteSystem : Object  {
      public abstract void execute();
    }

    public interface IInitializeSystem : Object  {
      public abstract void initialize();
    }

}
