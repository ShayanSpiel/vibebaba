import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  content: string;
  className?: string;
}

export default function Markdown({ content, className = '' }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-3 text-text-primary" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-2 mt-4 text-text-primary" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mb-2 mt-3 text-text-primary" {...props} />,
          p: ({ node, ...props }) => <p className="mb-3 text-text-primary leading-relaxed" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-outside mb-3 space-y-1 pl-5" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-outside mb-3 space-y-1 pl-5" {...props} />,
          li: ({ node, ...props }) => <li className="text-text-primary pl-1" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-text-primary" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-text-primary" {...props} />,
          code: ({ node, ...props }) => (
            <code className="px-1.5 py-0.5 bg-background-subtle text-brand-primary rounded text-sm font-mono" {...props} />
          ),
          pre: ({ node, ...props }) => (
            <pre className="bg-background-sunken border border-light rounded-lg p-3 mb-3 overflow-x-auto" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-brand-primary pl-4 italic text-text-secondary my-3" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-brand-primary hover:text-brand-primary-hover underline" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
