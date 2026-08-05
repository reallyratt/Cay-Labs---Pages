import React, { useState, useEffect, useRef } from 'react';
import {
  Pin,
  Archive,
  Trash2,
  Folder as FolderIcon,
  Check,
  ArrowLeft,
  Share2,
  Tag,
  Calendar,
  ChevronDown,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignJustify,
  Paperclip,
  Image,
  Mic,
  Link as LinkIcon,
  Pencil,
  Disc,
  Minus,
  X,
  ChevronLeft,
  ChevronRight,
  Paintbrush,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Note, Folder } from '../types';
import { formatTimeAgo } from '../utils/storage';

interface NoteEditorProps {
  note: Note | null;
  folders: Folder[];
  onUpdateNote: (updated: Note) => void;
  onCloseMobile?: () => void;
  onArchiveNote?: (id: string) => void;
  onDeleteNote?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  isMobileView?: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  folders,
  onUpdateNote,
  onCloseMobile,
  onArchiveNote,
  onDeleteNote,
  onTogglePin,
  isMobileView = false,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const folderDropdownRef = useRef<HTMLDivElement>(null);

  // Floating Bar States
  const [activeCategory, setActiveCategory] = useState<'size' | 'style' | 'list' | 'align' | 'attach'>('style');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  const [selectedSize, setSelectedSize] = useState<'S1' | 'S2' | 'S3' | 'S4'>('S3');
  const [selectedStyles, setSelectedStyles] = useState<Set<string>>(new Set());
  const [selectedList, setSelectedList] = useState<'none' | 'dots' | 'numbers' | 'abc' | 'stripes'>('none');
  const [isContinued, setIsContinued] = useState<boolean>(false);
  const [selectedAlign, setSelectedAlign] = useState<'left' | 'justify'>('left');
  const [tabIndentLevel, setTabIndentLevel] = useState<number>(0);
  const editorRef = useRef<HTMLDivElement>(null);

  const formatInitialHTML = (rawContent: string) => {
    if (!rawContent) return '<p><br></p>';
    if (rawContent.includes('<') && rawContent.includes('>')) return rawContent;
    return rawContent
      .split('\n')
      .map((line) => `<p>${line.trim() ? line : '<br>'}</p>`)
      .join('');
  };

  const handleContentInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setContent(html);
      triggerAutoSave(title, html, folderId);
    }
  };

  const getIndentLevel = (node: Node | null, container: HTMLElement | null): number => {
    if (!node || !container) return 0;
    let curr: Node | null = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    let level = 0;
    let listCount = 0;
    while (curr && curr !== container) {
      if (curr instanceof HTMLElement) {
        const tag = curr.tagName.toLowerCase();
        if (tag === 'blockquote') {
          level++;
        } else if (tag === 'ul' || tag === 'ol') {
          listCount++;
          if (listCount > 1) {
            level++;
          }
        } else if (curr.style.marginLeft) {
          const px = parseInt(curr.style.marginLeft, 10);
          if (!isNaN(px) && px > 0) {
            level += Math.max(1, Math.round(px / 40));
          }
        }
      }
      curr = curr.parentNode;
    }
    return Math.min(4, level);
  };

  const updateCursorFormatState = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const isBold = document.queryCommandState('bold');
    const isItalic = document.queryCommandState('italic');
    const isUnderline = document.queryCommandState('underline');
    const isStrike = document.queryCommandState('strikeThrough');

    const newStyles = new Set<string>();
    if (isBold) newStyles.add('bold');
    if (isItalic) newStyles.add('italic');
    if (isUnderline) newStyles.add('underline');
    if (isStrike) newStyles.add('strikethrough');
    setSelectedStyles(newStyles);

    let node = selection.anchorNode;
    if (node && node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    if (node instanceof HTMLElement) {
      const block = node.closest('h1, h2, h3, h4, p, div');
      if (block) {
        const tag = block.tagName.toLowerCase();
        if (tag === 'h1') setSelectedSize('S1');
        else if (tag === 'h2') setSelectedSize('S2');
        else if (tag === 'h4') setSelectedSize('S4');
        else setSelectedSize('S3');
      }

      const listEl = node.closest('ul, ol');
      if (listEl instanceof HTMLElement) {
        const startVal = listEl.getAttribute('start');
        setIsContinued(!!startVal && parseInt(startVal, 10) > 1);
        if (listEl.tagName.toLowerCase() === 'ol') {
          const typeAttr = listEl.getAttribute('type');
          if (typeAttr === 'A' || listEl.classList.contains('list-abc') || listEl.style.listStyleType === 'upper-alpha') {
            setSelectedList('abc');
          } else {
            setSelectedList('numbers');
          }
        } else if (listEl.tagName.toLowerCase() === 'ul') {
          if (listEl.classList.contains('list-stripes') || listEl.style.listStyleType === "'- '") {
            setSelectedList('stripes');
          } else {
            setSelectedList('dots');
          }
        }
      } else {
        setSelectedList('none');
        setIsContinued(false);
      }
    }

    const currentLevel = getIndentLevel(selection.anchorNode, editorRef.current);
    setTabIndentLevel(currentLevel);
  };

  const applyInlineStyle = (command: string) => {
    document.execCommand(command, false);
    handleContentInput();
    updateCursorFormatState();
  };

  const applySizeToSelectedLines = (s: 'S1' | 'S2' | 'S3' | 'S4') => {
    let tag = 'p';
    if (s === 'S1') tag = 'h1';
    else if (s === 'S2') tag = 'h2';
    else if (s === 'S3') tag = 'p';
    else if (s === 'S4') tag = 'h4';

    document.execCommand('formatBlock', false, `<${tag}>`);
    setSelectedSize(s);
    handleContentInput();
  };

  const applyListToSelectedLines = (targetList: 'dots' | 'numbers' | 'abc' | 'stripes') => {
    if (editorRef.current && !editorRef.current.contains(document.activeElement)) {
      editorRef.current.focus();
    }

    const selection = window.getSelection();
    let currentListEl: HTMLElement | null = null;
    if (selection && selection.anchorNode) {
      let node: Node | null = selection.anchorNode;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
      if (node instanceof HTMLElement) {
        currentListEl = node.closest('ul, ol');
      }
    }

    const currentTag = currentListEl ? currentListEl.tagName.toLowerCase() : null;
    const isToggleOff = selectedList === targetList;

    if (isToggleOff) {
      if (currentTag === 'ol') {
        document.execCommand('insertOrderedList', false);
      } else if (currentTag === 'ul') {
        document.execCommand('insertUnorderedList', false);
      }
      setSelectedList('none');
      setIsContinued(false);
      handleContentInput();
      return;
    }

    const isTargetOrdered = targetList === 'numbers' || targetList === 'abc';
    const targetTag = isTargetOrdered ? 'ol' : 'ul';

    if (currentTag !== targetTag) {
      if (isTargetOrdered) {
        document.execCommand('insertOrderedList', false);
      } else {
        document.execCommand('insertUnorderedList', false);
      }
    }

    const activeSel = window.getSelection();
    if (activeSel && activeSel.anchorNode) {
      let node: Node | null = activeSel.anchorNode;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
      if (node instanceof HTMLElement) {
        const activeList = node.closest('ul, ol') as HTMLElement | null;
        const allLists = editorRef.current?.querySelectorAll('ul, ol');
        const listsToUpdate: HTMLElement[] = activeList ? [activeList] : (allLists ? Array.from(allLists) as HTMLElement[] : []);

        listsToUpdate.forEach((listEl) => {
          listEl.removeAttribute('start');
          listEl.style.listStyleType = '';
          listEl.querySelectorAll('li').forEach((li) => {
            (li as HTMLElement).style.listStyleType = '';
            li.removeAttribute('type');
          });

          if (targetList === 'abc') {
            listEl.setAttribute('type', 'A');
            listEl.className = 'list-abc';
            listEl.style.listStyleType = 'upper-alpha';
          } else if (targetList === 'numbers') {
            listEl.setAttribute('type', '1');
            listEl.className = 'list-numbers';
            listEl.style.listStyleType = 'decimal';
          } else if (targetList === 'dots') {
            listEl.removeAttribute('type');
            listEl.className = 'list-dots';
            listEl.style.listStyleType = 'disc';
          } else if (targetList === 'stripes') {
            listEl.removeAttribute('type');
            listEl.className = 'list-stripes';
            listEl.style.listStyleType = "'- '";
          }
        });
      }
    }

    setSelectedList(targetList);
    setIsContinued(false);
    handleContentInput();
    setTimeout(() => {
      updateCursorFormatState();
    }, 0);
  };

  const continueFromPreviousList = () => {
    if (editorRef.current && !editorRef.current.contains(document.activeElement)) {
      editorRef.current.focus();
    }

    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;

    let node: Node | null = selection.anchorNode;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    if (!(node instanceof HTMLElement)) return;

    let currentListEl = node.closest('ul, ol') as HTMLElement | null;

    if (!currentListEl) {
      const listCmd = selectedList === 'abc' || selectedList === 'numbers' ? 'insertOrderedList' : 'insertUnorderedList';
      document.execCommand(listCmd, false);
      const selAfter = window.getSelection();
      if (selAfter && selAfter.anchorNode) {
        let n: Node | null = selAfter.anchorNode;
        if (n.nodeType === Node.TEXT_NODE) n = n.parentNode;
        if (n instanceof HTMLElement) {
          currentListEl = (n.closest('ol, ul') as HTMLElement) || currentListEl;
        }
      }
    }

    if (!currentListEl) return;

    const currentStart = currentListEl.getAttribute('start');
    if (currentStart && parseInt(currentStart, 10) > 1) {
      currentListEl.removeAttribute('start');
      setIsContinued(false);
      handleContentInput();
      setTimeout(() => updateCursorFormatState(), 0);
      return;
    }

    // Determine target mode based on selectedList or current list attributes
    const isCurrentAbc = selectedList === 'abc' || currentListEl.getAttribute('type') === 'A' || currentListEl.classList.contains('list-abc') || currentListEl.style.listStyleType === 'upper-alpha';
    const targetMode: 'abc' | 'numbers' = isCurrentAbc ? 'abc' : 'numbers';

    const allOls = Array.from(editorRef.current?.querySelectorAll('ol') || []) as HTMLOListElement[];
    let currentIdx = allOls.indexOf(currentListEl as HTMLOListElement);

    let prevOl: HTMLOListElement | null = null;

    // Search for preceding <ol> elements in DOM order
    const candidates = currentIdx > 0 
      ? allOls.slice(0, currentIdx) 
      : allOls.filter((ol) => ol !== currentListEl && ((ol as HTMLElement).compareDocumentPosition(currentListEl!) & Node.DOCUMENT_POSITION_PRECEDING) === 0);

    if (candidates.length > 0) {
      // Find candidate matching targetMode if possible
      const matchingModeCandidate = [...candidates].reverse().find((ol) => {
        const typeAttr = ol.getAttribute('type');
        const isAbc = typeAttr === 'A' || ol.classList.contains('list-abc') || ol.style.listStyleType === 'upper-alpha';
        return targetMode === 'abc' ? isAbc : !isAbc;
      });
      prevOl = matchingModeCandidate || candidates[candidates.length - 1];
    }

    if (!prevOl) return;

    const prevStartVal = parseInt(prevOl.getAttribute('start') || '1', 10);
    const prevItemsCount = prevOl.querySelectorAll('li').length;
    const newStartVal = prevStartVal + prevItemsCount;

    if (currentListEl.tagName.toLowerCase() === 'ul') {
      document.execCommand('insertOrderedList', false);
      const selAfter = window.getSelection();
      if (selAfter && selAfter.anchorNode) {
        let n: Node | null = selAfter.anchorNode;
        if (n.nodeType === Node.TEXT_NODE) n = n.parentNode;
        if (n instanceof HTMLElement) {
          currentListEl = (n.closest('ol') as HTMLElement) || currentListEl;
        }
      }
    }

    currentListEl.setAttribute('start', newStartVal.toString());
    if (targetMode === 'abc') {
      currentListEl.setAttribute('type', 'A');
      currentListEl.className = 'list-abc';
      currentListEl.style.listStyleType = 'upper-alpha';
      setSelectedList('abc');
    } else {
      currentListEl.setAttribute('type', '1');
      currentListEl.className = 'list-numbers';
      currentListEl.style.listStyleType = 'decimal';
      setSelectedList('numbers');
    }

    setIsContinued(true);
    handleContentInput();
    setTimeout(() => updateCursorFormatState(), 0);
  };

  const applyIndent = (direction: 'increase' | 'decrease') => {
    if (editorRef.current && !editorRef.current.contains(document.activeElement)) {
      editorRef.current.focus();
    }

    if (direction === 'increase') {
      if (tabIndentLevel >= 4) return;
      document.execCommand('indent', false);
    } else {
      if (tabIndentLevel <= 0) return;
      document.execCommand('outdent', false);
    }

    handleContentInput();
    setTimeout(() => {
      updateCursorFormatState();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        applyIndent('decrease');
      } else {
        applyIndent('increase');
      }
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsCategoryMenuOpen(false);
    if (
      e.target === e.currentTarget ||
      (e.target as HTMLElement).classList.contains('content-area-wrapper')
    ) {
      if (editorRef.current) {
        editorRef.current.focus();
        const sel = window.getSelection();
        if (sel) {
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  };

  const applyAlignment = (align: 'left' | 'justify') => {
    if (align === 'justify') {
      document.execCommand('justifyFull', false);
    } else if (align === 'left') {
      document.execCommand('justifyLeft', false);
    }
    setSelectedAlign(align);
    handleContentInput();
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (folderDropdownRef.current && !folderDropdownRef.current.contains(event.target as Node)) {
        setIsFolderDropdownOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      const html = formatInitialHTML(note.content);
      setContent(html);
      if (editorRef.current) {
        editorRef.current.innerHTML = html;
      }
      setFolderId(note.folderId || null);
    } else {
      setTitle('');
      setContent('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '<p><br></p>';
      }
      setFolderId(null);
    }
  }, [note?.id]);

  if (!note) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#8C8679] bg-[#F9F7F2]">
        <div className="w-16 h-16 rounded-2xl bg-[#F1EDE4] flex items-center justify-center mb-4 text-[#433F3E]">
          <FolderIcon className="w-8 h-8 stroke-1" />
        </div>
        <h3 className="text-lg font-bold text-[#2D2A29] mb-1">Select or Create a Page</h3>
        <p className="text-sm max-w-sm">Choose a page from the directory on the left or tap New Page to start writing.</p>
      </div>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave(val, content, folderId);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    triggerAutoSave(title, val, folderId);
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value || null;
    setFolderId(val);
    triggerAutoSave(title, content, val);
  };

  const triggerAutoSave = (newTitle: string, newContent: string, newFolderId: string | null) => {
    setSaveStatus('saving');
    const updated: Note = {
      ...note,
      title: newTitle,
      content: newContent,
      folderId: newFolderId,
      updatedAt: Date.now(),
    };
    onUpdateNote(updated);
    setTimeout(() => setSaveStatus('saved'), 400);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const currentFolder = folders.find((f) => f.id === folderId);

  const categories = [
    { id: 'size', label: 'Size', icon: <Type className="w-4 h-4" /> },
    { id: 'list', label: 'Lists', icon: <List className="w-4 h-4" /> },
    { id: 'style', label: 'Emphasis', icon: <Bold className="w-4 h-4" /> },
    { id: 'align', label: 'Paragraph', icon: <AlignLeft className="w-4 h-4" /> },
    { id: 'attach', label: 'Attachment', icon: <Paperclip className="w-4 h-4" /> },
  ] as const;

  const activeCatObj = categories.find((c) => c.id === activeCategory) || categories[0];

  // Build styling class for textarea
  const contentStyleClasses = [
    selectedAlign === 'left' ? 'text-left' : '',
    selectedAlign === 'justify' ? 'text-justify' : '',
    selectedAlign === 'infinity' ? 'whitespace-nowrap overflow-x-auto' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="h-full flex flex-col bg-[#F9F7F2] text-[#2D2A29] relative overflow-hidden">
      {/* Editor Body - Clicking anywhere in editor closes category dropup or focuses text */}
      <div
        onClick={handleContainerClick}
        className="flex-1 overflow-y-auto p-6 sm:p-12 max-w-3xl w-full mx-auto flex flex-col gap-6 pb-[80vh]"
      >
        {/* Note Top Metadata & Action Bar */}
        <div className="flex items-center justify-between gap-4 text-xs text-[#8C8679] select-none pt-2 sm:pt-0">
          {/* Left Side: Mobile Back, Pin Icon, Folder Icon + Folder Name */}
          <div className="flex items-center gap-3.5 min-w-0">
            {isMobileView && onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 -ml-1 text-[#433F3E] hover:bg-[#E8E4D9]/60 rounded-lg transition-colors focus:outline-none cursor-pointer"
                title="Back to list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {/* Pin Icon */}
            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(note.id)}
                className={`p-1 rounded-md transition-colors focus:outline-none cursor-pointer ${
                  note.isPinned
                    ? 'text-[#2D2A29]'
                    : 'text-[#8C8679] hover:text-[#2D2A29]'
                }`}
                title={note.isPinned ? 'Unpin page' : 'Pin page'}
              >
                <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-current text-[#2D2A29]' : ''}`} />
              </button>
            )}

            {/* Folder Icon & Name */}
            <div className="relative flex items-center" ref={folderDropdownRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFolderDropdownOpen((prev) => !prev);
                }}
                className="flex items-center gap-1.5 p-1 rounded-md text-[#8C8679] hover:text-[#2D2A29] hover:bg-[#E8E4D9]/50 transition-colors cursor-pointer select-none focus:outline-none"
                title="Change folder"
              >
                <FolderIcon className="w-4 h-4 shrink-0 text-[#8C8679]" />
                <AnimatePresence mode="wait">
                  {currentFolder && (
                    <motion.span
                      key={currentFolder.id}
                      initial={{ opacity: 0, x: -10, width: 0 }}
                      animate={{ opacity: 1, x: 0, width: 'auto' }}
                      exit={{ opacity: 0, x: -10, width: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="font-semibold text-[#2D2A29] truncate max-w-[180px] inline-block whitespace-nowrap overflow-hidden text-xs"
                    >
                      {currentFolder.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                <ChevronDown className={`w-3.5 h-3.5 text-[#8C8679] transition-transform duration-200 ${isFolderDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isFolderDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute left-0 top-full mt-1.5 w-48 bg-white/95 backdrop-blur-md rounded-xl border border-[#E8E4D9] shadow-lg py-1.5 z-50 overflow-hidden"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C8679] px-3 py-1.5 select-none">
                      Select Folder
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFolderId(null);
                        triggerAutoSave(title, content, null);
                        setIsFolderDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-[#F1EDE4] transition-colors cursor-pointer ${
                        !folderId ? 'font-bold text-[#2D2A29] bg-[#F1EDE4]/60' : 'text-[#433F3E]'
                      }`}
                    >
                      <span>No Folder</span>
                      {!folderId && <Check className="w-3.5 h-3.5 text-[#2D2A29]" />}
                    </button>
                    {folders.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setFolderId(f.id);
                          triggerAutoSave(title, content, f.id);
                          setIsFolderDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-[#F1EDE4] transition-colors cursor-pointer ${
                          folderId === f.id ? 'font-bold text-[#2D2A29] bg-[#F1EDE4]/60' : 'text-[#433F3E]'
                        }`}
                      >
                        <span className="truncate">{f.name}</span>
                        {folderId === f.id && <Check className="w-3.5 h-3.5 text-[#2D2A29]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Side: Updated timestamp & Word/Character count */}
          <div className="flex items-center gap-2 shrink-0 text-[#8C8679] font-medium text-xs">
            <span>{formatTimeAgo(note.updatedAt)}</span>
            <span>•</span>
            <span>
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
            <span>•</span>
            <span>
              {charCount} {charCount === 1 ? 'character' : 'characters'}
            </span>
          </div>
        </div>

        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onFocus={() => setIsCategoryMenuOpen(false)}
          placeholder="New Page"
          className="w-full text-3xl sm:text-4xl font-bold text-[#2D2A29] placeholder-[#E8E4D9] bg-transparent border-0 focus:outline-none focus:ring-0 px-0 tracking-tight"
        />

        {/* Content Editable Area */}
        <div className="w-full flex-1 min-h-[60vh] relative mt-2 content-area-wrapper">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentInput}
            onSelect={updateCursorFormatState}
            onKeyUp={updateCursorFormatState}
            onClick={updateCursorFormatState}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsCategoryMenuOpen(false)}
            data-placeholder="Start writing..."
            className="w-full h-full min-h-[60vh] text-[#433F3E] bg-transparent border-0 focus:outline-none focus:ring-0 px-0 resize-none leading-relaxed font-sans outline-none note-editor-editable pb-32"
          />
        </div>
      </div>

      {/* Floating Bottom Toolbar */}
      <div className="fixed sm:absolute bottom-4 left-4 sm:left-12 z-50 select-none flex items-center gap-2 max-w-[calc(100vw-1.5rem)] px-1">
        {/* Left Circle Button: Category Selector */}
        <div className="relative shrink-0" ref={categoryMenuRef}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              setIsCategoryMenuOpen((prev) => !prev);
            }}
            className="h-11 px-1 rounded-full bg-[#2D2A29] hover:bg-[#433F3E] text-[#F9F7F2] border border-[#433F3E] shadow-xl flex items-center justify-center transition-colors cursor-pointer"
            title="Select formatting category"
            aria-label="Select formatting category"
          >
            <div className="w-8 h-8 rounded-full bg-[#8C8679] text-white flex items-center justify-center shadow-xs">
              {activeCatObj.icon}
            </div>
          </motion.button>

          {/* Upward Dropdown Menu with slide up / slide down animation */}
          <AnimatePresence>
            {isCategoryMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.94 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-full mb-2.5 left-0 bg-[#2D2A29] text-[#F9F7F2] border border-[#433F3E] shadow-2xl rounded-2xl p-1.5 flex flex-col gap-1 min-w-[150px] z-50 overflow-hidden"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C8679] px-2.5 py-1 select-none">
                  STYLE
                </div>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCategory(cat.id);
                      setIsCategoryMenuOpen(false);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                      activeCategory === cat.id
                        ? 'bg-[#433F3E] text-white font-bold'
                        : 'hover:bg-[#3A3635] text-[#D8D2C6]'
                    }`}
                  >
                    <span className="text-[#F9F7F2]">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Multi-Item Pill with smooth width & layout transition */}
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
          className="h-11 px-1.5 bg-[#2D2A29] text-[#F9F7F2] rounded-full shadow-2xl flex items-center gap-1 border border-[#433F3E] shrink-0 overflow-hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="flex items-center gap-1 shrink-0"
            >
              {activeCategory === 'style' && (
                <>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyInlineStyle('bold')}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                      selectedStyles.has('bold')
                        ? 'bg-white text-[#2D2A29] shadow-xs'
                        : 'text-[#D8D2C6] hover:bg-[#433F3E] hover:text-white'
                    }`}
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyInlineStyle('italic')}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                      selectedStyles.has('italic')
                        ? 'bg-white text-[#2D2A29] shadow-xs'
                        : 'text-[#D8D2C6] hover:bg-[#433F3E] hover:text-white'
                    }`}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyInlineStyle('underline')}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                      selectedStyles.has('underline')
                        ? 'bg-white text-[#2D2A29] shadow-xs'
                        : 'text-[#D8D2C6] hover:bg-[#433F3E] hover:text-white'
                    }`}
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyInlineStyle('strikethrough')}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                      selectedStyles.has('strikethrough')
                        ? 'bg-white text-[#2D2A29] shadow-xs'
                        : 'text-[#D8D2C6] hover:bg-[#433F3E] hover:text-white'
                    }`}
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>
                </>
              )}

              {activeCategory === 'size' && (
                <>
                  {(['S1', 'S2', 'S3', 'S4'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applySizeToSelectedLines(s)}
                      className={`w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                        selectedSize === s
                          ? 'bg-white text-[#2D2A29] shadow-xs font-bold'
                          : 'text-[#D8D2C6] hover:bg-[#433F3E] hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold px-0.5">{s}</span>
                    </button>
                  ))}
                </>
              )}

              {activeCategory === 'list' && (
                <>
                  <button
                    type="button"
                    disabled={tabIndentLevel <= 0}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyIndent('decrease')}
                    className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${
                      tabIndentLevel <= 0
                        ? 'opacity-20 cursor-not-allowed text-[#8C8679] pointer-events-none'
                        : 'text-[#D8D2C6] hover:bg-[#433F3E] hover:text-white cursor-pointer active:scale-90'
                    }`}
                    title="Decrease indent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={tabIndentLevel >= 4}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyIndent('increase')}
                    className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${
                      tabIndentLevel >= 4
                        ? 'opacity-20 cursor-not-allowed text-[#8C8679] pointer-events-none'
                        : 'text-[#D8D2C6] hover:bg-[#433F3E] hover:text-white cursor-pointer active:scale-90'
                    }`}
                    title={tabIndentLevel >= 4 ? 'Maximum indent reached (4)' : 'Increase indent'}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="w-px h-4 bg-[#433F3E] mx-0.5 shrink-0" />

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyListToSelectedLines('dots')}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                      selectedList === 'dots'
                        ? 'bg-white text-[#2D2A29] shadow-xs'
                        : 'text-[#D8D2C6] hover:bg-[#433F3E] hover:text-white'
                    }`}
                    title="Bullet List"
                  >
                    <Disc className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyListToSelectedLines('stripes')}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                      selectedList === 'stripes'
                        ? 'bg-white text-[#2D2A29] shadow-xs'
                        : 'text-[#D8D2C6] hover:bg-[#433F3E] hover:text-white'
                    }`}
                    title="Dashed List"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyListToSelectedLines('numbers')}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                      selectedList === 'numbers'
                        ? 'bg-white text-[#2D2A29] shadow-xs'
                        : 'text-[#D8D2C6] hover:bg-[#433F3E] hover:text-white'
                    }`}
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyListToSelectedLines('abc')}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                      selectedList === 'abc'
                        ? 'bg-white text-[#2D2A29] shadow-xs'
                        : 'text-[#D8D2C6] hover:bg-[#433F3E] hover:text-white'
                    }`}
                    title="Alphabetical List"
                  >
                    <span className="font-mono text-xs font-bold px-0.5">ABC</span>
                  </button>

                  <AnimatePresence>
                    {(selectedList === 'numbers' || selectedList === 'abc') && (
                      <motion.div
                        initial={{ opacity: 0, width: 0, scale: 0.8 }}
                        animate={{ opacity: 1, width: 'auto', scale: 1 }}
                        exit={{ opacity: 0, width: 0, scale: 0.8 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="flex items-center overflow-hidden shrink-0"
                      >
                        <div className="w-px h-4 bg-[#433F3E] mx-1 shrink-0" />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={continueFromPreviousList}
                          className={`w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                            isContinued
                              ? 'bg-white text-[#2D2A29] shadow-xs'
                              : 'text-[#D8D2C6] hover:bg-[#433F3E] hover:text-white'
                          }`}
                          title="Continue from previous list"
                        >
                          <Paintbrush className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {activeCategory === 'align' && (
                <>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyAlignment('left')}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                      selectedAlign === 'left'
                        ? 'bg-white text-[#2D2A29] shadow-xs'
                        : 'text-[#D8D2C6] hover:bg-[#433F3E] hover:text-white'
                    }`}
                    title="Align Left"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyAlignment('justify')}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                      selectedAlign === 'justify'
                        ? 'bg-white text-[#2D2A29] shadow-xs'
                        : 'text-[#D8D2C6] hover:bg-[#433F3E] hover:text-white'
                    }`}
                    title="Align Justify"
                  >
                    <AlignJustify className="w-4 h-4" />
                  </button>
                </>
              )}

              {activeCategory === 'attach' && (
                <div className="relative flex items-center space-x-1">
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-[#1F1C1B] border border-[#433F3E] text-[10px] font-semibold tracking-wider uppercase text-[#E6E0D4] shadow-md pointer-events-none whitespace-nowrap flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Coming Soon
                  </motion.div>
                  <button
                    type="button"
                    disabled
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C8679] opacity-40 cursor-not-allowed pointer-events-none"
                    title="Link (Coming Soon)"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C8679] opacity-40 cursor-not-allowed pointer-events-none"
                    title="Media (Coming Soon)"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C8679] opacity-40 cursor-not-allowed pointer-events-none"
                    title="Audio (Coming Soon)"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C8679] opacity-40 cursor-not-allowed pointer-events-none"
                    title="Drawing (Coming Soon)"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};


