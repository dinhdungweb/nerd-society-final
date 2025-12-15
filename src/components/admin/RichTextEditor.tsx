'use client'

import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

const modules = {
    toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        [{ direction: 'rtl' }],
        ['blockquote', 'code-block'],
        [{ script: 'sub' }, { script: 'super' }],
        ['link', 'image', 'video'],
        ['clean'],
    ],
}

const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'script',
    'color', 'background',
    'list', 'bullet', 'indent',
    'align', 'direction',
    'blockquote', 'code-block',
    'link', 'image', 'video',
]

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    return (
        <div className="rich-text-editor">
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                className="bg-white dark:bg-neutral-800 rounded-lg"
            />
            <style jsx global>{`
                .rich-text-editor .ql-container {
                    min-height: 300px;
                    font-size: 16px;
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                }
                .rich-text-editor .ql-toolbar {
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    background: #f9fafb;
                    flex-wrap: wrap;
                }
                .rich-text-editor .ql-editor {
                    line-height: 1.75;
                }
                .rich-text-editor .ql-editor img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 1rem 0;
                }
                .rich-text-editor .ql-align-center {
                    text-align: center;
                }
                .rich-text-editor .ql-align-right {
                    text-align: right;
                }
                .rich-text-editor .ql-align-justify {
                    text-align: justify;
                }
                .rich-text-editor .ql-align-center img {
                    margin-left: auto;
                    margin-right: auto;
                }
                .rich-text-editor .ql-align-right img {
                    margin-left: auto;
                    margin-right: 0;
                }
                .dark .rich-text-editor .ql-toolbar {
                    background: #262626;
                    border-color: #404040;
                }
                .dark .rich-text-editor .ql-container {
                    border-color: #404040;
                }
                .dark .rich-text-editor .ql-editor {
                    color: #e5e5e5;
                }
                .dark .rich-text-editor .ql-toolbar .ql-stroke {
                    stroke: #a3a3a3;
                }
                .dark .rich-text-editor .ql-toolbar .ql-fill {
                    fill: #a3a3a3;
                }
                .dark .rich-text-editor .ql-toolbar .ql-picker {
                    color: #a3a3a3;
                }
                .dark .rich-text-editor .ql-toolbar .ql-picker-options {
                    background: #262626;
                    border-color: #404040;
                }
                .rich-text-editor .ql-editor.ql-blank::before {
                    font-style: normal;
                    color: #9ca3af;
                }
            `}</style>
        </div>
    )
}

