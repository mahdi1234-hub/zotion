"use client";

import React from "react";

interface SerializedLexicalNode {
  type: string;
  children?: SerializedLexicalNode[];
  text?: string;
  format?: number;
  tag?: string;
  listType?: string;
  url?: string;
  newTab?: boolean;
  direction?: string;
  indent?: number;
  version?: number;
  value?: {
    url?: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  fields?: {
    url?: string;
    newTab?: boolean;
    linkType?: string;
  };
  [key: string]: unknown;
}

interface RichTextContent {
  root: {
    children: SerializedLexicalNode[];
    direction: string;
    format: string;
    indent: number;
    type: string;
    version: number;
  };
}

function serializeNode(node: SerializedLexicalNode, index: number): React.ReactNode {
  if (node.type === "text") {
    let element: React.ReactNode = node.text ?? "";
    const format = node.format ?? 0;
    if (format & 1) element = <strong key={index}>{element}</strong>;
    if (format & 2) element = <em key={index}>{element}</em>;
    if (format & 4) element = <s key={index}>{element}</s>;
    if (format & 8) element = <u key={index}>{element}</u>;
    if (format & 16) element = <code key={index} className="bg-muted rounded px-1.5 py-0.5 font-mono text-sm">{element}</code>;
    return element;
  }

  if (node.type === "linebreak") {
    return <br key={index} />;
  }

  const children = node.children?.map((child, i) => serializeNode(child, i)) ?? [];

  switch (node.type) {
    case "heading": {
      const tag = (node.tag ?? "h2") as string;
      const headingClasses: Record<string, string> = {
        h1: "text-3xl font-bold mt-8 mb-4",
        h2: "text-2xl font-bold mt-7 mb-3",
        h3: "text-xl font-semibold mt-6 mb-3",
        h4: "text-lg font-semibold mt-5 mb-2",
        h5: "text-base font-semibold mt-4 mb-2",
        h6: "text-sm font-semibold mt-4 mb-2",
      };
      return React.createElement(
        tag,
        { key: index, className: headingClasses[tag] ?? "" },
        ...children,
      );
    }

    case "paragraph":
      if (children.length === 0 || (children.length === 1 && children[0] === "")) {
        return <div key={index} className="h-4" />;
      }
      return (
        <p key={index} className="text-foreground mb-4 leading-7">
          {children}
        </p>
      );

    case "list": {
      const ListTag = node.listType === "number" ? "ol" : "ul";
      const listClass =
        node.listType === "number"
          ? "mb-4 list-decimal space-y-1 pl-6"
          : "mb-4 list-disc space-y-1 pl-6";
      return (
        <ListTag key={index} className={listClass}>
          {children}
        </ListTag>
      );
    }

    case "listitem":
      return (
        <li key={index} className="text-foreground leading-7">
          {children}
        </li>
      );

    case "quote":
      return (
        <blockquote
          key={index}
          className="text-muted-foreground border-primary/30 my-4 border-l-4 pl-4 italic"
        >
          {children}
        </blockquote>
      );

    case "link":
    case "autolink":
      return (
        <a
          key={index}
          href={node.fields?.url ?? node.url ?? "#"}
          target={node.fields?.newTab || node.newTab ? "_blank" : undefined}
          rel={node.fields?.newTab || node.newTab ? "noopener noreferrer" : undefined}
          className="text-primary hover:text-primary/80 underline underline-offset-4"
        >
          {children}
        </a>
      );

    case "upload": {
      const url = node.value?.url;
      const alt = node.value?.alt ?? "Image";
      if (url) {
        return (
          <figure key={index} className="my-6">
            <img
              src={url}
              alt={alt}
              className="w-full rounded-lg"
              loading="lazy"
            />
          </figure>
        );
      }
      return null;
    }

    case "horizontalrule":
      return <hr key={index} className="border-border my-8" />;

    default:
      if (children.length > 0) {
        return <div key={index}>{children}</div>;
      }
      return null;
  }
}

export const RichTextRenderer = ({ content }: { content: RichTextContent | null | undefined }) => {
  if (!content?.root?.children) {
    return null;
  }

  return (
    <div className="prose-zotion">
      {content.root.children.map((node, index) => serializeNode(node, index))}
    </div>
  );
};
