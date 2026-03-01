import React from 'react';

import { Link } from '@react-email/link';

export type TemplateCustomMessageBodyProps = {
  text?: string;
};

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const linkifyLine = (line: string): React.ReactNode => {
  const parts = line.split(URL_REGEX);

  if (parts.length === 1) {
    return line;
  }

  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <Link key={i} href={part} style={{ color: '#6366f1', textDecoration: 'underline' }}>
        {part}
      </Link>
    ) : (
      part
    ),
  );
};

export const TemplateCustomMessageBody = ({ text }: TemplateCustomMessageBodyProps) => {
  if (!text) {
    return null;
  }

  const normalized = text
    .trim()
    .replace(/\r\n?/g, '\n')
    .replace(/\n\s*\n+/g, '\n\n')
    .replace(/\n{2,}/g, '\n\n');

  const paragraphs = normalized.split('\n\n');

  return paragraphs.map((paragraph, i) => (
    <p
      key={`p-${i}`}
      className="whitespace-pre-line break-words font-sans text-base text-slate-400"
    >
      {paragraph.split('\n').map((line, j) => (
        <React.Fragment key={`line-${i}-${j}`}>
          {j > 0 && <br />}
          {linkifyLine(line)}
        </React.Fragment>
      ))}
    </p>
  ));
};

export default TemplateCustomMessageBody;
