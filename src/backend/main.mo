import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import NotesTypes "types/notes";
import AiTypes "types/ai";
import NotesLib "lib/notes";
import AiLib "lib/ai";
import NotesMixin "mixins/notes-api";
import AiMixin "mixins/ai-api";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let notesStore : NotesLib.NotesStore = Map.empty<Nat, NotesTypes.Note>();
  let noteCounter : NotesLib.CounterRef = { var value = 0 };
  let aiResultStore : AiLib.AiResultStore = Map.empty<Nat, AiTypes.AiResult>();
  let processingStore : AiLib.ProcessingStore = Map.empty<Nat, AiTypes.ProcessingState>();
  let openAiKeyRef : AiLib.ApiKeyRef = { var value = "" };

  include NotesMixin(accessControlState, notesStore, noteCounter);
  include AiMixin(accessControlState, notesStore, aiResultStore, processingStore, openAiKeyRef);
};
