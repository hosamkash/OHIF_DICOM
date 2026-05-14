import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { cn } from '../lib/utils';
import { getLucideIcon } from '../lib/lucide-icons';

/** Tree-shaken lucide in this app only exposes `icons`; resolve via {@link getLucideIcon}. */
const LucideBold = getLucideIcon('Bold');
const LucideItalic = getLucideIcon('Italic');
const LucideUnderline = getLucideIcon('Underline');
const LucideStrikethrough = getLucideIcon('Strikethrough');
const LucideType = getLucideIcon('Type');
const LucidePalette = getLucideIcon('Palette');
const LucideHighlighter = getLucideIcon('Highlighter');
const LucideEraser = getLucideIcon('Eraser');
const LucideChevronDown = getLucideIcon('ChevronDown');
const LucideList = getLucideIcon('List');
const LucideListOrdered = getLucideIcon('ListOrdered');
const LucideAlignRight = getLucideIcon('AlignRight');
const LucideAlignCenter = getLucideIcon('AlignCenter');

const FONT_SIZES: { value: string; label: string }[] = [
  { value: '1', label: 'صغير جداً' },
  { value: '2', label: 'صغير' },
  { value: '3', label: 'عادي' },
  { value: '4', label: 'متوسط' },
  { value: '5', label: 'كبير' },
  { value: '6', label: 'كبير جداً' },
  { value: '7', label: 'ضخم' },
];

const FONT_COLORS: { value: string; label: string }[] = [
  { value: '#000000', label: 'أسود' },
  { value: '#1e40af', label: 'أزرق' },
  { value: '#b91c1c', label: 'أحمر' },
  { value: '#15803d', label: 'أخضر' },
  { value: '#a16207', label: 'بني' },
  { value: '#7e22ce', label: 'بنفسجي' },
];

const HIGHLIGHT_COLORS: { value: string; label: string }[] = [
  { value: '#fef08a', label: 'أصفر' },
  { value: '#bbf7d0', label: 'أخضر فاتح' },
  { value: '#bfdbfe', label: 'أزرق فاتح' },
  { value: '#fecaca', label: 'أحمر فاتح' },
  { value: '#e9d5ff', label: 'بنفسجي فاتح' },
];

export interface CtrRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
  editorClassName?: string;
  minHeight?: string;
  placeholder?: string;
  dir?: 'rtl' | 'ltr';
  showToolbar?: boolean;
}

export interface CtrRichTextEditorHandle {
  insertTextAtCursor: (text: string) => void;
  focus: () => void;
}

const CtrRichTextEditor = forwardRef<CtrRichTextEditorHandle, CtrRichTextEditorProps>(
  function CtrRichTextEditor(
    {
      value,
      onChange,
      readOnly = false,
      disabled = false,
      className,
      editorClassName,
      minHeight = '200px',
      placeholder,
      dir = 'rtl',
      showToolbar = true,
    },
    ref
  ) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isDisabled = readOnly || disabled;
    const [fontColorOpen, setFontColorOpen] = useState(false);
    const [highlightOpen, setHighlightOpen] = useState(false);

    const emitChange = useCallback(() => {
      const html = editorRef.current?.innerHTML ?? '';
      onChange(html);
    }, [onChange]);

    useImperativeHandle(
      ref,
      () => ({
        insertTextAtCursor(text: string) {
          const el = editorRef.current;
          if (!el) return;
          el.focus();
          const sel = window.getSelection();
          if (!sel) return;
          try {
            const range = sel.rangeCount > 0 ? sel.getRangeAt(0) : document.createRange();
            if (range) {
              range.selectNodeContents(el);
              range.collapse(true);
              const node = document.createTextNode(text);
              range.insertNode(node);
              range.setStartAfter(node);
              range.setEndAfter(node);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          } catch {
            const nextHtml = (el.innerHTML || '') + text;
            el.innerHTML = nextHtml;
          }
          emitChange();
        },
        focus() {
          editorRef.current?.focus();
        },
      }),
      [emitChange]
    );

    useEffect(() => {
      const el = editorRef.current;
      if (!el) return;
      const normalized = (value || '').trim();
      const asHtml = normalized.includes('<') ? normalized : normalized.replace(/\n/g, '<br>');
      if (el.innerHTML !== asHtml) {
        el.innerHTML = asHtml || '';
      }
    }, [value]);

    const exec = (cmd: string, valueArg?: string) => {
      document.execCommand(cmd, false, valueArg);
      editorRef.current?.focus();
      emitChange();
    };

    return (
      <div
        className={cn(
          'overflow-hidden rounded-lg border border-slate-200 bg-white text-[#0b1120]',
          className
        )}
        dir={dir}
      >
        {showToolbar && !isDisabled && (
          <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-100 p-1 text-slate-800 [&_button]:text-slate-800 [&_svg]:text-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => exec('bold')}
              title="عريض"
            >
              <LucideBold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => exec('italic')}
              title="مائل"
            >
              <LucideItalic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => exec('underline')}
              title="تحته خط"
            >
              <LucideUnderline className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => exec('strikeThrough')}
              title="يتوسطه خط"
            >
              <LucideStrikethrough className="h-4 w-4" />
            </Button>
            <span className="mx-0.5 h-5 w-px bg-slate-300" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2"
                  title="حجم الخط"
                >
                  <LucideType className="h-4 w-4" />
                  <span className="hidden text-xs sm:inline">حجم</span>
                  <LucideChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'end' : 'start'}>
                {FONT_SIZES.map(({ value: v, label }) => (
                  <DropdownMenuItem
                    key={v}
                    onClick={() => exec('fontSize', v)}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu
              open={fontColorOpen}
              onOpenChange={setFontColorOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2"
                  title="لون الخط"
                >
                  <LucidePalette className="h-4 w-4" />
                  <span className="hidden text-xs sm:inline">لون</span>
                  <LucideChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={dir === 'rtl' ? 'end' : 'start'}
                className="p-2"
              >
                <div className="grid grid-cols-3 gap-1">
                  {FONT_COLORS.map(({ value: v, label }) => (
                    <button
                      key={v}
                      type="button"
                      className="h-7 w-7 rounded border border-slate-300 hover:ring-2 hover:ring-emerald-500"
                      style={{ backgroundColor: v }}
                      title={label}
                      onClick={() => {
                        exec('foreColor', v);
                        setFontColorOpen(false);
                      }}
                    />
                  ))}
                </div>
                <DropdownMenuSeparator className="my-2" />
                <div className="flex items-center gap-2 px-2">
                  <input
                    type="color"
                    className="h-8 w-8 cursor-pointer rounded border border-slate-300 p-0"
                    defaultValue="#000000"
                    onChange={e => {
                      exec('foreColor', e.target.value);
                      setFontColorOpen(false);
                    }}
                  />
                  <span className="text-xs text-slate-600">لون مخصص</span>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu
              open={highlightOpen}
              onOpenChange={setHighlightOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2"
                  title="تظليل"
                >
                  <LucideHighlighter className="h-4 w-4" />
                  <span className="hidden text-xs sm:inline">تظليل</span>
                  <LucideChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={dir === 'rtl' ? 'end' : 'start'}
                className="p-2"
              >
                <div className="grid grid-cols-3 gap-1">
                  {HIGHLIGHT_COLORS.map(({ value: v, label }) => (
                    <button
                      key={v}
                      type="button"
                      className="h-7 w-7 rounded border border-slate-300 hover:ring-2 hover:ring-emerald-500"
                      style={{ backgroundColor: v }}
                      title={label}
                      onClick={() => {
                        exec('backColor', v);
                        setHighlightOpen(false);
                      }}
                    />
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => exec('removeFormat')}
              title="إزالة التنسيق"
            >
              <LucideEraser className="h-4 w-4" />
            </Button>
            <span className="mx-0.5 h-5 w-px bg-slate-300" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => exec('insertUnorderedList')}
              title="قائمة نقطية"
            >
              <LucideList className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => exec('insertOrderedList')}
              title="قائمة مرقمة"
            >
              <LucideListOrdered className="h-4 w-4" />
            </Button>
            <span className="mx-0.5 h-5 w-px bg-slate-300" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => exec('justifyRight')}
              title="محاذاة لليمين"
            >
              <LucideAlignRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => exec('justifyCenter')}
              title="محاذاة للوسط"
            >
              <LucideAlignCenter className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!isDisabled}
          suppressContentEditableWarning
          data-placeholder={placeholder}
          className={cn(
            'px-4 py-3 text-sm text-[#0b1120] outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]',
            isDisabled && 'cursor-default bg-slate-100',
            editorClassName
          )}
          style={{ minHeight }}
          onInput={emitChange}
          onBlur={emitChange}
        />
      </div>
    );
  }
);

export default CtrRichTextEditor;
