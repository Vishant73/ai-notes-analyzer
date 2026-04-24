import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Common "../types/common";
import Types "../types/notes";

module {
  public type NotesStore = Map.Map<Common.NoteId, Types.Note>;
  public type CounterRef = { var value : Nat };

  public func createNote(
    store : NotesStore,
    counter : CounterRef,
    owner : Principal,
    req : Types.CreateNoteRequest,
    now : Common.Timestamp,
  ) : Types.Note {
    let id = counter.value;
    counter.value += 1;
    let note : Types.Note = {
      id;
      owner;
      content = req.content;
      createdAt = now;
      wordCount = countWords(req.content);
    };
    store.add(id, note);
    note;
  };

  public func listNotes(store : NotesStore, owner : Principal) : [Types.Note] {
    store.values()
      .filter(func(n : Types.Note) : Bool { Principal.equal(n.owner, owner) })
      .toArray();
  };

  public func getNote(store : NotesStore, id : Common.NoteId, owner : Principal) : ?Types.Note {
    switch (store.get(id)) {
      case (?note) {
        if (Principal.equal(note.owner, owner)) ?note else null;
      };
      case null null;
    };
  };

  public func deleteNote(store : NotesStore, id : Common.NoteId, owner : Principal) : Bool {
    switch (store.get(id)) {
      case (?note) {
        if (Principal.equal(note.owner, owner)) {
          store.remove(id);
          true;
        } else {
          false;
        };
      };
      case null false;
    };
  };

  public func countWords(content : Text) : Nat {
    // Split by whitespace and count non-empty tokens
    let tokens = content.split(#predicate(func(c : Char) : Bool {
      c == ' ' or c == '\n' or c == '\t' or c == '\r';
    }));
    var count = 0;
    for (token in tokens) {
      if (not token.isEmpty()) {
        count += 1;
      };
    };
    count;
  };

  public func totalWordsForOwner(store : NotesStore, owner : Principal) : Nat {
    store.values()
      .filter(func(n : Types.Note) : Bool { Principal.equal(n.owner, owner) })
      .foldLeft(0, func(acc : Nat, n : Types.Note) : Nat { acc + n.wordCount });
  };
};
