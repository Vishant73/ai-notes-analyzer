import Common "common";

module {
  public type Note = {
    id : Common.NoteId;
    owner : Common.UserId;
    content : Text;
    createdAt : Common.Timestamp;
    wordCount : Nat;
  };

  public type CreateNoteRequest = {
    content : Text;
  };
};
