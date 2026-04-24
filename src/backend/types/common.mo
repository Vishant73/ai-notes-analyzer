module {
  public type UserId = Principal;
  public type NoteId = Nat;
  public type Timestamp = Int;

  public type ProcessingStatus = {
    #pending;
    #processing;
    #complete;
    #failed;
  };
};
