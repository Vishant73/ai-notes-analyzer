import Common "common";

module {
  public type AiResult = {
    noteId : Common.NoteId;
    shortSummary : Text;
    mediumSummary : Text;
    detailedSummary : Text;
    keywords : [Text];
    processedAt : Common.Timestamp;
  };

  public type ProcessingState = {
    noteId : Common.NoteId;
    status : Common.ProcessingStatus;
    updatedAt : Common.Timestamp;
  };

  public type DashboardStats = {
    totalNotes : Nat;
    totalWordsAnalyzed : Nat;
  };
};
