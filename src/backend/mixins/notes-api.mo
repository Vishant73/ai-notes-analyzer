import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import NoteTypes "../types/notes";
import NotesLib "../lib/notes";

mixin (
  accessControlState : AccessControl.AccessControlState,
  notesStore : NotesLib.NotesStore,
  noteCounter : NotesLib.CounterRef,
) {
  public shared ({ caller }) func createNote(req : NoteTypes.CreateNoteRequest) : async NoteTypes.Note {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to create notes");
    };
    NotesLib.createNote(notesStore, noteCounter, caller, req, Time.now());
  };

  public query ({ caller }) func listNotes() : async [NoteTypes.Note] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to list notes");
    };
    NotesLib.listNotes(notesStore, caller);
  };

  public query ({ caller }) func getNote(id : Common.NoteId) : async ?NoteTypes.Note {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to get a note");
    };
    NotesLib.getNote(notesStore, id, caller);
  };

  public shared ({ caller }) func deleteNote(id : Common.NoteId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to delete notes");
    };
    NotesLib.deleteNote(notesStore, id, caller);
  };
};
