import React from "react";
import ReactMarkdown from "react-markdown";

export default function MessageText({ text }: { text: string }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          h1: ({node, ...p}) => <h3 className="mt-2 mb-1 text-lg font-bold" {...p} />,
          h2: ({node, ...p}) => <h4 className="mt-2 mb-1 text-base font-bold" {...p} />,
          h3: ({node, ...p}) => <h5 className="mt-2 mb-1 font-semibold" {...p} />,
          ul: ({node, ...p}) => <ul className="list-disc ps-5 my-2 space-y-1" {...p} />,
          ol: ({node, ...p}) => <ol className="list-decimal ps-5 my-2 space-y-1" {...p} />,
          p:  ({node, ...p}) => <p className="my-1 leading-7" {...p} />,
          code: ({node, inline, ...p}) =>
            inline ? <code className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800" {...p} /> :
                     <code className="block p-2 rounded bg-neutral-200 dark:bg-neutral-800 overflow-x-auto" {...p} />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
