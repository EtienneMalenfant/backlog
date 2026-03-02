<template>
  <div :class="{'doneItem': isDone, 'isEditing': isEditing}"
       class="item list-complete-item"
       :data-id="itemId"
       :data-boardId="boardId"
       :draggable="isEditing">
    <Transition name="fade" v-if="isEditing">
      <EmojiPicker @addEmoji="addEmoji"
                   @closeEmoji="hideEmoji"
                   style="position: absolute; top:40px; right:7.2%;"
                   ref="emojiPicker"
                   v-if="emojiPicker"/>
    </Transition>
    <textarea-autosize
      v-if="isEditing"
      v-model="draftText"
      ref="inputEdit"
      autocomplete="off"
      spellcheck="false"
      :placeholder="$t('item.enter_something')"
      rows="1"
      autofocus="autofocus"
      class="ivu-input draftText animated"
      @keyup.esc.native="turnOffEditing"
      @keydown.enter.exact.native.prevent="saveItem(); turnOffEditing();"
      @keydown.meta.69.native="showEmoji"
      @keydown.ctrl.69.native="showEmoji"
      @click.native="trackCaret"
      @keyup.exact.native="trackCaret"
      :class="{'slideInDown' : isEditing}"
    >
    </textarea-autosize>

    <Button type="primary"
            v-if="isEditing"
            class="ok-edit-btns"
            @click="saveItem(); turnOffEditing();"
    >
      {{$t('common.ok')}}
    </Button>
    <button v-if="isEditing"
            style="display:none;"
            v-shortkey="acceptEditShortcut"
            @shortkey="saveItem(); turnOffEditing();"/>
    <Button
      v-if="isEditing"
      class="ok-edit-btns"
      style="margin-left:4px;"
      @click="turnOffEditing"
    >
      {{$t('common.cancel')}}
      <span class="shortcut">{{shortcutString('cancelItemChange')}}</span>
    </Button>
    <EmojiButton class="emoji-btn" v-if="isEditing"
                 @toggleEmoji="toggleEmoji"/>


    <div class="item-div"
         v-else>
      <Checkbox :value="isDone"
                @on-change="changeIsDone">
      </Checkbox>
      <span class="item-text"
            v-html="textWithLink"
            @click="handleLinkClick"
            @dblclick="editItem"
      >
      </span>
      <Icon type="ios-brush-outline"
            class="edit-icon"
            @click="editItem"
            v-if="!isEditing"
            size="16"/>

      <div class="drag">
        <Icon type="md-reorder"></Icon>
      </div>

      <ActionButtons @remove="removeItem"
                     @moveToTop="moveItemToTop"
                     @moveToBottom="moveItemToBottom"
                     :boardId="boardId"
      >
      </ActionButtons>

      <BoardItemCalendar :created="created" v-if="showDate"/>
    </div>
  </div>
</template>

<script>
  import ActionButtons from './ActionButtons';
  import MarkdownIt from 'markdown-it';
  import BoardItemCalendar from './BoardItemCalendar';
  import keyShortcutMixin from './../../../keyShortcutStringMixin';
  import EmojiPicker from './../EmojiPicker';
  import EmojiButton from './EmojiButton';
  import electron from 'electron';
  const { shell } = electron;

  const md = new MarkdownIt({
    breaks: true
  });

  export default {
    name: 'board-item',
    components: {BoardItemCalendar, ActionButtons, EmojiButton, EmojiPicker},
    mixins: [keyShortcutMixin],
    props: ['boardId', 'itemId', 'isDone', 'text', 'created'],
    data () {
      return {
        isEditing: false,
        draftText: this.text,
        showDropdown: false,
        emojiPicker: false,
        caretPosition: this.text.length
      };
    },
    created () {
      this.$bus.$on('finishItemEditing', this.turnOffEditing);
    },
    methods: {
      trackCaret () {
        this.caretPosition = this.$refs.inputEdit.$el.selectionStart;
      },
      showEmoji () {
        this.emojiPicker = true;
        this.$nextTick(() => {
          this.$refs.emojiPicker.focusOnSearchInput();
        });
      },
      hideEmoji () {
        this.emojiPicker = false;
        this.focusOnInput();
      },
      toggleEmoji () {
        this.emojiPicker = !this.emojiPicker;
        if (this.emojiPicker) {
          this.$nextTick(() => {
            this.$refs.emojiPicker.focusOnSearchInput();
          });
        } else {
          this.focusOnInput();
        }
      },
      addEmoji ({emoji}) {
        const emojiLength = emoji.length;
        const beforeText = this.draftText.slice(0, this.caretPosition);
        const afterText = this.draftText.slice(this.caretPosition, this.draftText.length);
        this.draftText = beforeText + emoji + afterText;
        this.caretPosition += emojiLength;
        this.focusOnInput();
      },
      focusOnInput () {
        this.$nextTick(() => {
          if (this.$refs['inputEdit']) {
            this.$refs.inputEdit.$el.focus();
            this.$refs.inputEdit.$el.selectionStart = this.caretPosition;
            this.$refs.inputEdit.$el.selectionEnd = this.caretPosition;
          }
        });
      },
      saveItem () {
        if (this.draftText.trim() === '') {
          this.draftText = '';
          return;
        }
        this.$store.dispatch('changeItemVal', {
          boardId: this.boardId,
          itemId: this.itemId,
          newVal: this.draftText
        });
        this.$store.dispatch('fetchBoardItems', this.boardId);
      },
      editItem () {
        this.draftText = this.text;
        this.isEditing = true;
        this.$nextTick().then(() => this.focusOnInput());
      },
      turnOffEditing () {
        this.isEditing = false;
        this.$bus.$emit('focusOnAddItem');
        this.emojiPicker = false;
      },
      changeIsDone (newVal) {
        this.$store.dispatch('changeIsDone', {
          boardId: this.boardId,
          itemId: this.itemId,
          newVal
        });
        this.$store.dispatch('fetchBoardItems', this.boardId);
        this.$store.dispatch('fetchBoards');
        this.$bus.$emit('focusOnAddItem');
      },
      removeItem () {
        this.$store.dispatch('removeItem', {
          boardId: this.boardId,
          itemId: this.itemId
        });
        this.$store.dispatch('fetchBoardItems', this.boardId);
        this.$bus.$emit('focusOnAddItem');
        this.$Message.success(this.$t('board.item_removed'));
      },
      moveItemToTop () {
        this.$store.dispatch('moveItemToTop', {
          boardId: this.boardId,
          itemId: this.itemId
        });
        this.$store.dispatch('fetchBoardItems', this.boardId);
        this.$bus.$emit('focusOnAddItem');
      },
      moveItemToBottom () {
        this.$store.dispatch('moveItemToBottom', {
          boardId: this.boardId,
          itemId: this.itemId
        });
        this.$store.dispatch('fetchBoardItems', this.boardId);
        this.$bus.$emit('focusOnAddItem');
      },
      open (link) {
        shell.openExternal(link);
      },
      handleLinkClick (event) {
        event.preventDefault();
        if (event.target.className === 'link') {
          this.open(event.target.title);
        }

        if (event.target.tagName.toLowerCase() === 'a') {
          this.open(event.target.href);
        }
      }
    },
    computed: {
      acceptEditShortcut () {
        return this.$store.state.settings.keyBindings.acceptItemChange;
      },
      cancelEditShortcut () {
        return this.$store.state.settings.keyBindings.cancelItemChange;
      },
      isFiltered () {
        return this.$store.state.boards.findItem.itemText.length > 0;
      },
      showDate () {
        return this.$store.state.settings.itemCreationDate;
      },
      textWithLink () {
        return md.render(this.text).autoLink({
          callback: function (url) {
            return `<span class='link' title="${url}">${url.split('/')[2]}</span>`;
          }
        });
      }
    }
  };
</script>

<style scoped>

  .emoji-btn {
    position: absolute;
    top: 0;
    right: 7.5%;
    z-index: 100;
  }

  .emoji-btn >>> i {
    margin-top: 1px;
  }

  .shortcut {
    color: #dddddd;
    user-select: none;
    margin-left: 8px;
    font-size: .8em;
    line-height: 1em;
  }

  .item {
    transition: all .3s;
  }

  .item.newlyAddedItem {
    box-shadow: inset 0 0 70px var(--shadow-light);
    border: 1px solid var(--accent-primary);
  }

  .item-text {
    font-size: 1.2em;
    margin-top: 9px;
    color: var(--text-primary);
  }

  .item-text p {
    display: inline;
  }

  .drag {
    display: flex;
    align-items: center;
    margin-left: auto;
    margin-top: 8px;
    font-size: 2em;
    cursor: grab;
    opacity: 0;
    transition: opacity .3s;
  }

  .drag:active {
    cursor: grabbing;
  }

  .item-div:hover .drag {
    opacity: 1;
  }

  .item-div {
    max-width: 90%;
    display: flex;
  }

  .item {
    border-bottom: 1px solid var(--border-light);
    position: relative;
    min-height: 40px;
    -webkit-border-radius: 3px;
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }

  .item:hover {
    background-color: var(--bg-hover);
  }


  .ok-edit-btns {
    margin-left: 25px;
    margin-top: 8px;
    animation-duration: .3s;
  }

  .edit-icon {
    opacity: 0;
    cursor: pointer;
    transition: opacity .3s;
    margin-top: 12px;
  }

  .item-div:hover .edit-icon {
    opacity: 1;
  }


  .movable-icon {
    position: absolute;
    top: 10px;
    font-size: 2em;
    transition: all .25s;
    /*left: !*opacity: 0;*!*/
  }

  .item.doneItem {
    opacity: var(--opacity-done);
  }

  .item:hover .actionBtns {
    opacity: 1;
  }

  .item:hover .movable-icon {
    opacity: 1
  }

  .actionBtns {
    opacity: 0;
    cursor: pointer;
    flex-shrink: 0;
    align-self: center;
    transition: all .3s;
  }

  .actionBtns:hover {
    opacity: 1;
  }

  .item label {
    margin-top: 12px;
    padding-left: 5px;
    font-size: 1.3em;
    cursor: pointer;
    line-height: 16px;
    align-self: flex-start;
  }

  .isEditing {
    border-bottom: 1px dashed var(--border-darker);
    border-top: 1px dashed var(--border-darker);
  }

  textarea.draftText {
    margin-top: 8px;
    margin-left: 25px;
    transition: all .3s;
    width: 90%;
    animation-duration: .3s;
  }

  .item a {
    color: var(--text-link-alt) !important;
    font-style: italic;
    cursor: pointer;
  }

  .item a:hover {
    color: var(--text-link-hover) !important;
  }

  .item >>> .link {
    color: var(--text-link-alt);
    font-style: italic;
    cursor: pointer;
    -webkit-transition: all .3s;
    -moz-transition: all .3s;
    -ms-transition: all .3s;
    -o-transition: all .3s;
    transition: all .3s;
  }

  .item >>> .link:hover {
    color: var(--text-link-hover);
  }

</style>
