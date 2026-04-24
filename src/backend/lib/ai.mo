import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Common "../types/common";
import AiTypes "../types/ai";

module {
  public type AiResultStore = Map.Map<Common.NoteId, AiTypes.AiResult>;
  public type ProcessingStore = Map.Map<Common.NoteId, AiTypes.ProcessingState>;
  public type ApiKeyRef = { var value : Text };

  public func storeResult(
    store : AiResultStore,
    processingStore : ProcessingStore,
    result : AiTypes.AiResult,
    now : Common.Timestamp,
  ) {
    store.add(result.noteId, result);
    let state : AiTypes.ProcessingState = {
      noteId = result.noteId;
      status = #complete;
      updatedAt = now;
    };
    processingStore.add(result.noteId, state);
  };

  public func getResult(store : AiResultStore, noteId : Common.NoteId) : ?AiTypes.AiResult {
    store.get(noteId);
  };

  public func getProcessingStatus(processingStore : ProcessingStore, noteId : Common.NoteId) : ?Common.ProcessingStatus {
    switch (processingStore.get(noteId)) {
      case (?state) ?state.status;
      case null null;
    };
  };

  public func setProcessingStatus(
    processingStore : ProcessingStore,
    noteId : Common.NoteId,
    status : Common.ProcessingStatus,
    now : Common.Timestamp,
  ) {
    let state : AiTypes.ProcessingState = {
      noteId;
      status;
      updatedAt = now;
    };
    processingStore.add(noteId, state);
  };

  public func buildOpenAIPrompt(content : Text) : Text {
    "Analyze the following notes and return a JSON response with these exact fields: shortSummary (1-2 sentences), mediumSummary (1 paragraph), detailedSummary (full analysis), keywords (array of 5-10 key terms). Notes: " # content;
  };

  // Parse the OpenAI JSON response. Extracts fields by simple text scanning.
  // Returns null if essential fields are missing.
  public func parseOpenAIResponse(json : Text, noteId : Common.NoteId, now : Common.Timestamp) : ?AiTypes.AiResult {
    let shortSummary = extractJsonStringField(json, "shortSummary");
    let mediumSummary = extractJsonStringField(json, "mediumSummary");
    let detailedSummary = extractJsonStringField(json, "detailedSummary");
    let keywords = extractJsonStringArray(json, "keywords");

    switch (shortSummary, mediumSummary, detailedSummary) {
      case (?short, ?medium, ?detailed) {
        ?{
          noteId;
          shortSummary = short;
          mediumSummary = medium;
          detailedSummary = detailed;
          keywords;
          processedAt = now;
        };
      };
      case _ null;
    };
  };

  // Extract a string value for a given key from a JSON object.
  // Handles: "key": "value" (basic escaped strings).
  func extractJsonStringField(json : Text, key : Text) : ?Text {
    let searchKey = "\"" # key # "\"";
    switch (findAfter(json, searchKey)) {
      case null null;
      case (?rest) {
        // Skip whitespace and colon
        let afterColon = skipWhitespaceAndColon(rest);
        extractQuotedString(afterColon);
      };
    };
  };

  // Extract an array of strings for a given key from a JSON object.
  func extractJsonStringArray(json : Text, key : Text) : [Text] {
    let searchKey = "\"" # key # "\"";
    switch (findAfter(json, searchKey)) {
      case null [];
      case (?rest) {
        let afterColon = skipWhitespaceAndColon(rest);
        let trimmed = afterColon.trimStart(#char ' ');
        if (trimmed.startsWith(#char '[')) {
          let inner = switch (findAfter(trimmed, "[")) {
            case null "";
            case (?s) s;
          };
          // Extract each quoted string from the array
          parseStringArray(inner);
        } else [];
      };
    };
  };

  // Find the text after the first occurrence of `needle` in `haystack`.
  func findAfter(haystack : Text, needle : Text) : ?Text {
    let haystackChars = haystack.toArray();
    let needleChars = needle.toArray();
    let hLen = haystackChars.size();
    let nLen = needleChars.size();
    if (nLen == 0) return ?haystack;
    if (hLen < nLen) return null;

    var i = 0;
    label search while (i + nLen <= hLen) {
      var matched = true;
      var j = 0;
      while (j < nLen) {
        if (haystackChars[i + j] != needleChars[j]) {
          matched := false;
        };
        j += 1;
      };
      if (matched) {
        // Return text after needle
        let remaining = Text.fromIter(
          haystackChars.values().drop(i + nLen)
        );
        return ?remaining;
      };
      i += 1;
    };
    null;
  };

  // Skip whitespace and the first ':' character.
  func skipWhitespaceAndColon(text : Text) : Text {
    var seenColon = false;
    Text.fromIter(text.toIter().dropWhile(func(c : Char) : Bool {
      if (seenColon) return false;
      if (c == ':') { seenColon := true; return true };
      c == ' ' or c == '\t' or c == '\n' or c == '\r';
    }));
  };

  // Extract a quoted JSON string value (handles basic escape sequences).
  func extractQuotedString(text : Text) : ?Text {
    let trimmed = text.trimStart(#predicate(func(c : Char) : Bool {
      c == ' ' or c == '\t' or c == '\n' or c == '\r';
    }));
    if (not trimmed.startsWith(#text "\"")) return null;

    let chars = trimmed.toArray();
    if (chars.size() < 2) return null;

    var result = "";
    var i = 1; // skip opening quote
    var escape = false;
    label scan while (i < chars.size()) {
      let c = chars[i];
      if (escape) {
        switch (c) {
          case 'n' { result #= "\n" };
          case 't' { result #= "\t" };
          case 'r' { result #= "\r" };
          case '\u{22}' { result #= "\u{22}" };
          case '\u{5C}' { result #= "\u{5C}" };
          case _ { result #= Text.fromChar(c) };
        };
        escape := false;
      } else if (c == '\u{5C}') {
        escape := true;
      } else if (c == '\u{22}') {
        break scan;
      } else {
        result #= Text.fromChar(c);
      };
      i += 1;
    };
    ?result;
  };

  // Parse an array of JSON strings from text starting after '['.
  func parseStringArray(text : Text) : [Text] {
    var remaining = text;
    let results = Map.empty<Nat, Text>();
    var idx = 0;
    label loop_ while (true) {
      let trimmed = remaining.trimStart(#predicate(func(c : Char) : Bool {
        c == ' ' or c == '\t' or c == '\n' or c == '\r' or c == ',';
      }));
      if (trimmed.startsWith(#char ']') or trimmed.isEmpty()) {
        break loop_;
      };
      if (trimmed.startsWith(#text "\"")) {
        switch (extractQuotedStringWithRest(trimmed)) {
          case (?(value, rest)) {
            results.add(idx, value);
            idx += 1;
            remaining := rest;
          };
          case null { break loop_ };
        };
      } else {
        break loop_;
      };
    };
    // Convert map to array
    var arr : [Text] = [];
    var i = 0;
    while (i < idx) {
      switch (results.get(i)) {
        case (?v) { arr := arr.concat([v]) };
        case null {};
      };
      i += 1;
    };
    arr;
  };

  // Extract quoted string and return (value, remaining text after closing quote).
  func extractQuotedStringWithRest(text : Text) : ?(Text, Text) {
    let chars = text.toArray();
    if (chars.size() < 2 or chars[0] != '\u{22}') return null;

    var result = "";
    var i = 1;
    var escape = false;
    label scan while (i < chars.size()) {
      let c = chars[i];
      if (escape) {
        switch (c) {
          case 'n' { result #= "\n" };
          case 't' { result #= "\t" };
          case 'r' { result #= "\r" };
          case '\u{22}' { result #= "\u{22}" };
          case '\u{5C}' { result #= "\u{5C}" };
          case _ { result #= Text.fromChar(c) };
        };
        escape := false;
      } else if (c == '\u{5C}') {
        escape := true;
      } else if (c == '\u{22}') {
        let rest = Text.fromIter(chars.values().drop(i + 1));
        return ?(result, rest);
      } else {
        result #= Text.fromChar(c);
      };
      i += 1;
    };
    null;
  };
};
