import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import AccessControl "mo:caffeineai-authorization/access-control";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Common "../types/common";
import AiTypes "../types/ai";
import AiLib "../lib/ai";
import NotesLib "../lib/notes";

mixin (
  accessControlState : AccessControl.AccessControlState,
  notesStore : NotesLib.NotesStore,
  aiResultStore : AiLib.AiResultStore,
  processingStore : AiLib.ProcessingStore,
  openAiKeyRef : AiLib.ApiKeyRef,
) {
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func triggerAiAnalysis(noteId : Common.NoteId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to trigger AI analysis");
    };

    // Verify note ownership
    let note = switch (NotesLib.getNote(notesStore, noteId, caller)) {
      case (?n) n;
      case null Runtime.trap("Note not found or access denied");
    };

    let now = Time.now();
    AiLib.setProcessingStatus(processingStore, noteId, #processing, now);

    let prompt = AiLib.buildOpenAIPrompt(note.content);

    let requestBody = "{\"model\":\"gpt-4o-mini\",\"messages\":[{\"role\":\"user\",\"content\":" # escapeJsonString(prompt) # "}],\"temperature\":0.3}";

    try {
      let responseText = await OutCall.httpPostRequest(
        "https://api.openai.com/v1/chat/completions",
        [
          { name = "Authorization"; value = "Bearer " # openAiApiKey() },
          { name = "Content-Type"; value = "application/json" },
        ],
        requestBody,
        transform,
      );

      // Extract the content field from the OpenAI chat completion response
      let contentJson = extractOpenAIContent(responseText);
      let processedAt = Time.now();

      switch (AiLib.parseOpenAIResponse(contentJson, noteId, processedAt)) {
        case (?result) {
          AiLib.storeResult(aiResultStore, processingStore, result, processedAt);
        };
        case null {
          AiLib.setProcessingStatus(processingStore, noteId, #failed, Time.now());
        };
      };
    } catch (_) {
      AiLib.setProcessingStatus(processingStore, noteId, #failed, Time.now());
    };
  };

  public query ({ caller }) func getAiResult(noteId : Common.NoteId) : async ?AiTypes.AiResult {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to get AI results");
    };
    // Verify ownership before returning result
    switch (NotesLib.getNote(notesStore, noteId, caller)) {
      case null null;
      case (?_) AiLib.getResult(aiResultStore, noteId);
    };
  };

  public query ({ caller }) func getProcessingStatus(noteId : Common.NoteId) : async ?Common.ProcessingStatus {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to get processing status");
    };
    // Verify ownership
    switch (NotesLib.getNote(notesStore, noteId, caller)) {
      case null null;
      case (?_) AiLib.getProcessingStatus(processingStore, noteId);
    };
  };

  public query ({ caller }) func getDashboardStats() : async AiTypes.DashboardStats {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to get dashboard stats");
    };
    let notes = NotesLib.listNotes(notesStore, caller);
    let totalNotes = notes.size();
    let totalWordsAnalyzed = NotesLib.totalWordsForOwner(notesStore, caller);
    { totalNotes; totalWordsAnalyzed };
  };

  // Escape a string for embedding in a JSON value.
  func escapeJsonString(s : Text) : Text {
    var result = "\"";
    for (c in s.toIter()) {
      switch (c) {
        case '\u{22}' { result #= "\u{5C}\u{22}" };
        case '\u{5C}' { result #= "\u{5C}\u{5C}" };
        case '\n' { result #= "\\n" };
        case '\r' { result #= "\\r" };
        case '\t' { result #= "\\t" };
        case other { result #= Text.fromChar(other) };
      };
    };
    result # "\"";
  };

  // Extract the assistant message content from an OpenAI chat completion JSON response.
  // Looks for the "content" field inside choices[0].message.
  func extractOpenAIContent(json : Text) : Text {
    // Find "content" key and extract its string value
    switch (findAfterNeedle(json, "\"content\"")) {
      case null json; // fallback: return full response for parseOpenAIResponse to handle
      case (?rest) {
        let afterColon = skipToColon(rest);
        switch (extractQuotedStr(afterColon)) {
          case (?value) value;
          case null json;
        };
      };
    };
  };

  func findAfterNeedle(haystack : Text, needle : Text) : ?Text {
    let hChars = haystack.toArray();
    let nChars = needle.toArray();
    let hLen = hChars.size();
    let nLen = nChars.size();
    if (nLen == 0) return ?haystack;
    if (hLen < nLen) return null;
    var i = 0;
    label outer while (i + nLen <= hLen) {
      var j = 0;
      var matched = true;
      while (j < nLen) {
        if (hChars[i + j] != nChars[j]) { matched := false };
        j += 1;
      };
      if (matched) {
        var result = "";
        var k = i + nLen;
        while (k < hLen) {
          result #= Text.fromChar(hChars[k]);
          k += 1;
        };
        return ?result;
      };
      i += 1;
    };
    null;
  };

  func skipToColon(text : Text) : Text {
    var seen = false;
    Text.fromIter(text.toIter().dropWhile(func(c : Char) : Bool {
      if (seen) return false;
      if (c == ':') { seen := true; return true };
      true;
    }));
  };

  func extractQuotedStr(text : Text) : ?Text {
    let trimmed = text.trimStart(#predicate(func(c : Char) : Bool {
      c == ' ' or c == '\t' or c == '\n' or c == '\r';
    }));
    let chars = trimmed.toArray();
    if (chars.size() < 2 or chars[0] != '\u{22}') return null;
    var result = "";
    var i = 1;
    var esc = false;
    label scan while (i < chars.size()) {
      let c = chars[i];
      if (esc) {
        switch (c) {
          case 'n' { result #= "\n" };
          case 't' { result #= "\t" };
          case 'r' { result #= "\r" };
          case '\u{22}' { result #= "\u{22}" };
          case '\u{5C}' { result #= "\u{5C}" };
          case _ { result #= Text.fromChar(c) };
        };
        esc := false;
      } else if (c == '\u{5C}') {
        esc := true;
      } else if (c == '\u{22}') {
        return ?result;
      } else {
        result #= Text.fromChar(c);
      };
      i += 1;
    };
    ?result;
  };

  // Admin function to configure the OpenAI API key post-deploy.
  public shared ({ caller }) func setOpenAiKey(key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set the API key");
    };
    openAiKeyRef.value := key;
  };

  // OpenAI API key — stored as persistent actor state, set via setOpenAiKey.
  func openAiApiKey() : Text {
    openAiKeyRef.value;
  };
};
