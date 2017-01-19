namespace Entitas {
    public interface IMatcher : Object {
      public abstract string id {get;}
      public abstract int[] indices {get;}
      public abstract bool matches(IEntity entity);
      public abstract string toString();
    }

    public interface ICompoundMatcher : Object {
      public abstract int[] allOfIndices {get;}
      public abstract int[] anyOfIndices {get;}
      public abstract int[] noneOfIndices {get;}

    }

    public interface INoneOfMatcher : Object {

    }

    public interface IAnyOfMatcher : Object {
      public abstract INoneOfMatcher noneOf(int[] args);
    }

    public interface IAllOfMatcher : Object {
      public abstract IAnyOfMatcher anyOf(int[] args);
      public abstract INoneOfMatcher noneOf(int[] args);
    }
}
